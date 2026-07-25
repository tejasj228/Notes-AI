import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/trash — list trashed notes
export async function GET(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const notes = await Note.find({ userId: auth.user._id, isTrashed: true })
      .populate('folderId', 'name color')
      .sort({ trashedAt: -1 })
      .lean();

    return ok({ data: { notes } });
  } catch (error) {
    console.error('Get trash error:', error);
    return fail('Error fetching trashed notes');
  }
}

// DELETE /api/trash — empty trash
export async function DELETE(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const result = await Note.deleteMany({ userId: auth.user._id, isTrashed: true });
    return ok({
      message: `${result.deletedCount} notes permanently deleted`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error('Empty trash error:', error);
    return fail('Error emptying trash');
  }
}
