import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const { noteOrders, folderId = null } = await request.json();

    if (!Array.isArray(noteOrders)) return fail('noteOrders must be an array', 400);

    await Promise.all(
      noteOrders.map(({ noteId, order }) =>
        Note.findOneAndUpdate(
          { _id: noteId, userId: auth.user._id, folderId: folderId || null, isTrashed: false },
          { order },
          { new: true }
        )
      )
    );

    return ok({ message: 'Notes reordered successfully' });
  } catch (error) {
    console.error('Reorder notes error:', error);
    return fail('Error reordering notes');
  }
}
