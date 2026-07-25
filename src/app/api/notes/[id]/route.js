import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_UPDATES = ['title', 'content', 'keywords', 'color', 'size', 'folderId', 'isPinned', 'order'];

// Load a note and confirm the requester owns it.
async function ownedNote(id, userId) {
  const note = await Note.findById(id);
  if (!note) return { error: 'Resource not found', status: 404 };
  if (note.userId.toString() !== userId.toString())
    return { error: 'Access denied: You do not own this resource', status: 403 };
  return { note };
}

export async function GET(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { id } = await params;

  try {
    await connectDB();
    const owned = await ownedNote(id, auth.user._id);
    if (owned.error) return fail(owned.error, owned.status);
    const note = await Note.findById(id).populate('folderId', 'name color').lean();
    return ok({ data: { note } });
  } catch (error) {
    console.error('Get note error:', error);
    return fail('Error fetching note');
  }
}

export async function PUT(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { id } = await params;

  try {
    await connectDB();
    const owned = await ownedNote(id, auth.user._id);
    if (owned.error) return fail(owned.error, owned.status);

    const body = await request.json();
    const updates = {};
    for (const key of Object.keys(body)) {
      if (!ALLOWED_UPDATES.includes(key)) continue;
      if (key === 'keywords' && Array.isArray(body[key])) updates[key] = body[key].slice(0, 3);
      else if (key === 'title' && body[key]) updates[key] = body[key].trim();
      else updates[key] = body[key];
    }

    const note = await Note.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('folderId', 'name color');

    return ok({ message: 'Note updated successfully', data: { note } });
  } catch (error) {
    console.error('Update note error:', error);
    return fail('Error updating note');
  }
}

// Move to trash
export async function DELETE(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { id } = await params;

  try {
    await connectDB();
    const owned = await ownedNote(id, auth.user._id);
    if (owned.error) return fail(owned.error, owned.status);
    await owned.note.moveToTrash();
    return ok({ message: 'Note moved to trash' });
  } catch (error) {
    console.error('Delete note error:', error);
    return fail('Error moving note to trash');
  }
}
