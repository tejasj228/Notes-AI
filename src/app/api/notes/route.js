import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import { getAuthUser } from '@/lib/auth';
import { getRandomColor, getRandomSize } from '@/lib/random';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/notes — all non-trashed notes for the user (client filters by folder)
export async function GET(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    const query = { userId: auth.user._id, isTrashed: false };
    if (folder !== null) {
      query.folderId = folder === 'null' || folder === '' ? null : folder;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { content: regex }, { keywords: { $in: [regex] } }];
    }

    const notes = await Note.find(query)
      .populate('folderId', 'name color')
      .sort({ order: 1, updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return ok({ data: { notes, pagination: { limit, skip, hasMore: notes.length === limit } } });
  } catch (error) {
    console.error('Get notes error:', error);
    return fail('Error fetching notes');
  }
}

// POST /api/notes — create a note
export async function POST(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const {
      title = 'Untitled Note',
      content = '',
      keywords = [],
      color,
      size,
      folderId = null,
      isPinned = false,
    } = await request.json();

    // Put the new note at the top of its location
    const minOrderNote = await Note.findOne({
      userId: auth.user._id,
      folderId: folderId || null,
      isTrashed: false,
    }).sort({ order: 1 });
    const newOrder = minOrderNote ? minOrderNote.order - 1 : 0;

    const note = await Note.create({
      title: (title || 'Untitled Note').trim(),
      content,
      keywords: Array.isArray(keywords) ? keywords.slice(0, 3) : [],
      color: color || getRandomColor(),
      size: size || getRandomSize(),
      folderId: folderId || null,
      isPinned,
      userId: auth.user._id,
      order: newOrder,
    });

    await note.populate('folderId', 'name color');

    return ok({ message: 'Note created successfully', data: { note } }, 201);
  } catch (error) {
    console.error('Create note error:', error);
    return fail('Error creating note');
  }
}
