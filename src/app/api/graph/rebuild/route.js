import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { extractNoteGraph } from '@/lib/graph/extract';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/graph/rebuild — (re)index all of the user's non-trashed notes.
// `force` re-extracts even unchanged notes.
export async function POST(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const { force = false } = await request.json().catch(() => ({}));

    const notes = await Note.find({ userId: auth.user._id, isTrashed: false });
    let indexed = 0;
    let triplets = 0;
    let skipped = 0;

    // Sequential to stay within Gemini free-tier rate limits.
    for (const note of notes) {
      try {
        const r = await extractNoteGraph(note, { force });
        if (r.skipped) skipped += 1;
        else {
          indexed += 1;
          triplets += r.count || 0;
        }
      } catch (e) {
        console.error('rebuild: note failed', note._id.toString(), e.message);
      }
    }

    return ok({ data: { notes: notes.length, indexed, skipped, triplets } });
  } catch (error) {
    console.error('Graph rebuild error:', error);
    return fail(`Error rebuilding graph: ${error.message}`, error.status || 500);
  }
}
