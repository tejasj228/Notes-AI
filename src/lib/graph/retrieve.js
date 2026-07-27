import Triplet from '@/lib/models/Triplet';
import Note from '@/lib/models/Note';
import { embed, cosine } from '@/lib/gemini';

// Retrieve the most relevant subgraph for a question about `note` and format it
// as a compact "Known facts" block for the LLM prompt.
//
// Pipeline: (1) the open note's own triplets, (2) semantic top-K over the user's
// triplet embeddings (cosine — works with or without an Atlas vector index),
// (3) 1-hop graph expansion via shared entities, (4) merge/rank/cap.
export async function retrieveContext({ userId, note, question, limit = 20 }) {
  const start = Date.now();

  const noteTriplets = await Triplet.find({ userId, noteId: note._id }).lean();

  // Bounded pull of the user's triplets for cosine ranking + graph expansion.
  const allTriplets = await Triplet.find({ userId }).sort({ updatedAt: -1 }).limit(2000).lean();

  // 2) semantic ranking
  let qVec = null;
  if (question && question.trim()) {
    try {
      qVec = await embed(question);
    } catch (e) {
      console.error('question embed failed:', e.message);
    }
  }
  const semantic = qVec
    ? allTriplets
        .filter((t) => t.embedding && t.embedding.length)
        .map((t) => ({ t, score: cosine(qVec, t.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
    : [];

  // 3) graph expansion via entities in the note's + top semantic triplets
  const entityIds = new Set();
  for (const t of [...noteTriplets, ...semantic.map((s) => s.t)]) {
    if (t.subject?.entityId) entityIds.add(String(t.subject.entityId));
    if (t.object?.entityId) entityIds.add(String(t.object.entityId));
  }
  let neighbors = [];
  if (entityIds.size) {
    const ids = [...entityIds];
    neighbors = await Triplet.find({
      userId,
      $or: [{ 'subject.entityId': { $in: ids } }, { 'object.entityId': { $in: ids } }],
    })
      .limit(80)
      .lean();
  }

  // 4) merge + score
  const byId = new Map();
  const bump = (t, base) => {
    const id = String(t._id);
    const prev = byId.get(id);
    if (!prev || base > prev.base) byId.set(id, { t, base });
  };
  noteTriplets.forEach((t) => bump(t, 1.0)); // open note's own facts win
  semantic.forEach(({ t, score }) => bump(t, 0.7 + 0.3 * score));
  neighbors.forEach((t) => bump(t, 0.5));

  const now = Date.now();
  const ranked = [...byId.values()]
    .map(({ t, base }) => {
      const ts = new Date(t.updatedAt || t.createdAt || now).getTime();
      const ageDays = (now - ts) / 86400000;
      const recency = Math.max(0, 1 - ageDays / 365) * 0.1;
      const conf = (t.metadata?.confidence ?? 0.7) * 0.1;
      return { t, score: base + recency + conf };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.t);

  const block = await formatFacts(ranked, note._id);
  return { facts: ranked, block, count: ranked.length, ms: Date.now() - start };
}

// Build the "Known facts" prompt block, annotating facts that come from OTHER notes.
async function formatFacts(triplets, currentNoteId) {
  if (!triplets.length) return '';

  const otherNoteIds = [
    ...new Set(
      triplets
        .filter((t) => String(t.noteId) !== String(currentNoteId))
        .map((t) => String(t.noteId))
    ),
  ];
  const titleById = new Map();
  if (otherNoteIds.length) {
    const notes = await Note.find({ _id: { $in: otherNoteIds } }, { title: 1 }).lean();
    notes.forEach((n) => titleById.set(String(n._id), n.title));
  }

  const lines = triplets.map((t) => {
    const fromOther =
      String(t.noteId) !== String(currentNoteId) ? `  [from "${titleById.get(String(t.noteId)) || 'another note'}"]` : '';
    return `- ${t.fact}${fromOther}`;
  });

  return `Known facts from the user's notebook (use these; they may include related notes):\n${lines.join('\n')}`;
}
