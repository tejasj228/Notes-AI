// Centralised Gemini REST helpers. New AQ.* keys require the X-goog-api-key
// header (the official SDK sends ?key=), so we always call REST directly.

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEN_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';

export const EMBED_DIM = 768;

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error('AI service is not configured. Set GEMINI_API_KEY.');
    err.status = 503;
    throw err;
  }
  return key;
}

// Low-level generateContent. `parts` is the Gemini parts array; `generationConfig`
// is optional (e.g. JSON mode). Returns the concatenated text of the first candidate.
export async function generateContent(parts, generationConfig) {
  const body = { contents: [{ parts }] };
  if (generationConfig) body.generationConfig = generationConfig;

  const res = await fetch(`${BASE}/${GEN_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Gemini HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    const err = new Error(`Blocked by safety filter (${blockReason})`);
    err.status = 400;
    err.blocked = true;
    throw err;
  }
  const textParts = data?.candidates?.[0]?.content?.parts || [];
  return textParts.map((p) => p.text).filter(Boolean).join('').trim();
}

// Plain text generation from a single prompt string.
export const generateText = (prompt) => generateContent([{ text: prompt }]);

// Structured JSON generation. Returns the parsed object/array, or null on parse failure.
export async function generateJSON(prompt, responseSchema) {
  const cfg = { responseMimeType: 'application/json' };
  if (responseSchema) cfg.responseSchema = responseSchema;
  const text = await generateContent([{ text: prompt }], cfg);
  try {
    return JSON.parse(text);
  } catch (_) {
    // Best-effort: pull the first JSON array/object out of the text
    const match = text.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (__) {}
    }
    return null;
  }
}

// Embed a single string → number[EMBED_DIM].
export async function embed(text) {
  const key = apiKey();
  const res = await fetch(`${BASE}/${EMBED_MODEL}:embedContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text: (text || '').slice(0, 8000) }] },
      outputDimensionality: EMBED_DIM,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Gemini embed HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data?.embedding?.values || [];
}

// Embed many strings → number[][]. This key's model only supports single
// embedContent, so we run limited-concurrency parallel calls.
export async function embedMany(texts) {
  if (!texts.length) return [];
  const CONCURRENCY = 4;
  const out = new Array(texts.length);
  let i = 0;
  async function worker() {
    while (i < texts.length) {
      const idx = i++;
      out[idx] = await embed(texts[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, texts.length) }, worker));
  return out;
}

// Cosine similarity between two equal-length vectors.
export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
