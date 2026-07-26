import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// PATCH /api/trash/:id/restore
export async function PATCH(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { id } = await params;

  try {
    await connectDB();
    const note = await Note.findOne({ _id: id, userId: auth.user._id, isTrashed: true });
    if (!note) return fail('Trashed note not found', 404);

    // Restore to the top of its location
    const minOrderNote = await Note.findOne({
      userId: auth.user._id,
      folderId: note.folderId,
      isTrashed: false,
    }).sort({ order: 1 });

    await note.restoreFromTrash();
    note.order = minOrderNote ? minOrderNote.order - 1 : 0;
    await note.save();
    await note.populate('folderId', 'name color');

    return ok({ message: 'Note restored successfully', data: { note } });
  } catch (error) {
    console.error('Restore note error:', error);
    return fail(`Error restoring note: ${error.message}`);
  }
}
