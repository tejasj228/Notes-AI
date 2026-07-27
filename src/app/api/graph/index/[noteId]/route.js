import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { extractNoteGraph } from '@/lib/graph/extract';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/graph/index/:noteId — (re)build the knowledge-graph slice for one note.
// Called fire-and-forget from the client after a save.
export async function POST(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { noteId } = await params;

  try {
    await connectDB();
    const note = await Note.findById(noteId);
    if (!note) return fail('Resource not found', 404);
    if (note.userId.toString() !== auth.user._id.toString())
      return fail('Access denied: You do not own this resource', 403);

    const result = await extractNoteGraph(note);
    return ok({ data: result });
  } catch (error) {
    console.error('Graph index error:', error);
    if (error.status === 429 || /quota|rate limit/i.test(error.message || '')) {
      return fail('AI quota exceeded while indexing — try again later.', 429);
    }
    return fail(`Error indexing note: ${error.message}`, error.status || 500);
  }
}
