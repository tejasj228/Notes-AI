import { connectDB } from '@/lib/db';
import Entity from '@/lib/models/Entity';
import Triplet from '@/lib/models/Triplet';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/graph — nodes (entities) + links (triplets) for the force-graph view.
// Optional ?noteId= scopes to a single note's subgraph.
export async function GET(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    const query = { userId: auth.user._id };
    if (noteId) query.noteId = noteId;

    const triplets = await Triplet.find(query).sort({ updatedAt: -1 }).limit(1500).lean();

    // Links only for triplets whose endpoints resolved to entities.
    const links = [];
    const degree = new Map();
    const entityIds = new Set();
    for (const t of triplets) {
      const s = t.subject?.entityId;
      const o = t.object?.entityId;
      if (!s || !o) continue;
      const sid = String(s);
      const oid = String(o);
      entityIds.add(sid);
      entityIds.add(oid);
      degree.set(sid, (degree.get(sid) || 0) + 1);
      degree.set(oid, (degree.get(oid) || 0) + 1);
      links.push({
        id: String(t._id),
        source: sid,
        target: oid,
        relation: t.relation,
        fact: t.fact,
        noteId: String(t.noteId),
        time: t.metadata?.time || null,
      });
    }

    const entities = await Entity.find(
      { userId: auth.user._id, _id: { $in: [...entityIds] } },
      { name: 1, type: 1 }
    ).lean();

    const nodes = entities.map((e) => ({
      id: String(e._id),
      name: e.name,
      type: e.type,
      val: 1 + (degree.get(String(e._id)) || 0),
    }));

    return ok({ data: { nodes, links, stats: { nodes: nodes.length, links: links.length } } });
  } catch (error) {
    console.error('Get graph error:', error);
    return fail(`Error building graph: ${error.message}`, error.status || 500);
  }
}
