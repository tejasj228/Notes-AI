import { connectDB } from '@/lib/db';
import Folder from '@/lib/models/Folder';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_UPDATES = ['name', 'color', 'order'];

async function ownedFolder(id, userId) {
  const folder = await Folder.findById(id);
  if (!folder) return { error: 'Resource not found', status: 404 };
  if (folder.userId.toString() !== userId.toString())
    return { error: 'Access denied: You do not own this resource', status: 403 };
  return { folder };
}

export async function PUT(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { id } = await params;

  try {
    await connectDB();
    const owned = await ownedFolder(id, auth.user._id);
    if (owned.error) return fail(owned.error, owned.status);

    const body = await request.json();
    const updates = {};
    for (const key of Object.keys(body)) {
      if (!ALLOWED_UPDATES.includes(key)) continue;
      updates[key] = key === 'name' && body[key] ? body[key].trim() : body[key];
    }

    if (updates.name) {
      const dup = await Folder.findOne({
        userId: auth.user._id,
        name: updates.name,
        _id: { $ne: id },
      });
      if (dup) return fail('Folder with this name already exists', 400);
    }

    const folder = await Folder.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!folder) return fail('Folder not found', 404);

    return ok({ message: 'Folder updated successfully', data: { folder } });
  } catch (error) {
    console.error('Update folder error:', error);
    return fail('Error updating folder');
  }
}

export async function DELETE(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { id } = await params;

  try {
    await connectDB();
    const owned = await ownedFolder(id, auth.user._id);
    if (owned.error) return fail(owned.error, owned.status);
    await owned.folder.deleteWithNotesHandling();
    return ok({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    return fail('Error deleting folder');
  }
}
