import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// DELETE /api/trash/:id — permanently delete a trashed note
export async function DELETE(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { id } = await params;

  try {
    await connectDB();
    const note = await Note.findOne({ _id: id, userId: auth.user._id, isTrashed: true });
    if (!note) return fail('Trashed note not found', 404);

    await note.permanentDelete();
    return ok({ message: 'Note permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    return fail('Error permanently deleting note');
  }
}
