import crypto from 'crypto';
import Note from '@/lib/models/Note';
import Entity, { ENTITY_TYPE_LIST } from '@/lib/models/Entity';
import Triplet from '@/lib/models/Triplet';
import { generateJSON, embedMany } from '@/lib/gemini';
import { stripHtml } from '@/utils/helpers';

const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?'"]+$/g, '')
    .trim();

const hashOf = (note) =>
  crypto.createHash('sha1').update(`${note.title || ''}\n${note.content || ''}`).digest('hex');

const normType = (t) => (ENTITY_TYPE_LIST.includes((t || '').toLowerCase()) ? t.toLowerCase() : 'other');

// Gemini structured-output schema for triplet extraction.
const EXTRACT_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      subject: { type: 'STRING' },
      subjectType: { type: 'STRING', enum: ENTITY_TYPE_LIST },
      relation: { type: 'STRING' },
      object: { type: 'STRING' },
      objectType: { type: 'STRING', enum: ENTITY_TYPE_LIST },
      time: { type: 'STRING' },
      confidence: { type: 'NUMBER' },
    },
    required: ['subject', 'relation', 'object'],
  },
};

const buildPrompt = (title, text) => `You are a knowledge-graph extractor. From the note below, extract the key factual triplets as (subject, relation, object).

Rules:
- Capture concrete, reusable facts: attributes, relationships, who/what/when/where, definitions, decisions, tasks.
- Keep subject/object short (a name or noun phrase). Use a concise lowercase relation (e.g. "works at", "due on", "is a", "located in").
- Classify each subject/object type as one of: ${ENTITY_TYPE_LIST.join(', ')}.
- If the note states or implies a time/date for a fact, put it in "time" (else omit).
- Give a confidence 0-1. Return 3-15 of the most important triplets. Skip filler.

Note title: ${title}
Note content:
${text.slice(0, 12000)}`;

// Extract triplets for a single note and (re)build its slice of the graph.
// Returns { count } or { skipped, reason }.
export async function extractNoteGraph(note, { force = false } = {}) {
  const title = note.title || 'Untitled';
  const text = stripHtml(note.content || '');
  const hash = hashOf(note);

  if (!force && note.graphIndexedHash === hash) return { skipped: true, reason: 'unchanged' };
  if (!text.trim() && !title.trim()) return { skipped: true, reason: 'empty' };

  const raw = await generateJSON(buildPrompt(title, text), EXTRACT_SCHEMA);
  const triples = (Array.isArray(raw) ? raw : [])
    .filter((t) => t && t.subject && t.relation && t.object)
    .map((t) => ({
      subject: String(t.subject).trim(),
      subjectType: normType(t.subjectType),
      relation: String(t.relation).trim().toLowerCase(),
      object: String(t.object).trim(),
      objectType: normType(t.objectType),
      time: t.time ? String(t.time).trim() : null,
      confidence: typeof t.confidence === 'number' ? Math.max(0, Math.min(1, t.confidence)) : 0.7,
    }))
    .slice(0, 30);

  // Replace this note's existing triplets (re-extraction is idempotent).
  await Triplet.deleteMany({ noteId: note._id, userId: note.userId });

  if (triples.length === 0) {
    await Note.updateOne({ _id: note._id }, { graphIndexedHash: hash });
    return { count: 0 };
  }

  // Resolve unique entities (find-or-create by normalized name).
  const entityInputs = new Map(); // normalized -> { name, type }
  for (const t of triples) {
    const sN = normalize(t.subject);
    const oN = normalize(t.object);
    if (sN && !entityInputs.has(sN)) entityInputs.set(sN, { name: t.subject, type: t.subjectType });
    if (oN && !entityInputs.has(oN)) entityInputs.set(oN, { name: t.object, type: t.objectType });
  }

  const idByNorm = new Map();
  await Promise.all(
    [...entityInputs.entries()].map(async ([norm, info]) => {
      const doc = await Entity.findOneAndUpdate(
        { userId: note.userId, normalized: norm },
        {
          $setOnInsert: { name: info.name, type: info.type },
          $addToSet: { noteIds: note._id },
        },
        { upsert: true, new: true }
      );
      idByNorm.set(norm, doc._id);
    })
  );

  // Embed the fact sentences (best-effort — store without embeddings if it fails).
  const facts = triples.map((t) => `${t.subject} ${t.relation} ${t.object}${t.time ? ` (${t.time})` : ''}`);
  let embeddings = [];
  try {
    embeddings = await embedMany(facts);
  } catch (e) {
    console.error('embedMany failed, storing triplets without embeddings:', e.message);
  }

  const docs = triples.map((t, i) => ({
    userId: note.userId,
    noteId: note._id,
    subject: { entityId: idByNorm.get(normalize(t.subject)), text: t.subject },
    relation: t.relation,
    object: { entityId: idByNorm.get(normalize(t.object)), text: t.object },
    fact: facts[i],
    embedding: embeddings[i] && embeddings[i].length ? embeddings[i] : undefined,
    metadata: { time: t.time, confidence: t.confidence, sourceSpan: '' },
  }));

  await Triplet.insertMany(docs);
  await Note.updateOne({ _id: note._id }, { graphIndexedHash: hash });

  return { count: docs.length };
}
