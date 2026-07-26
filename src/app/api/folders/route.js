import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Folder from '@/lib/models/Folder';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/folders — optionally with note counts
export async function GET(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const includeNotesCount = searchParams.get('includeNotesCount') === 'true';

    let folders;
    if (includeNotesCount) {
      folders = await Folder.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(auth.user._id) } },
        {
          $lookup: {
            from: 'notes',
            let: { folderId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$folderId', '$$folderId'] }, { $eq: ['$isTrashed', false] }],
                  },
                },
              },
              { $count: 'count' },
            ],
            as: 'notesCount',
          },
        },
        { $addFields: { notesCount: { $ifNull: [{ $arrayElemAt: ['$notesCount.count', 0] }, 0] } } },
        { $sort: { order: 1, createdAt: 1 } },
      ]);
    } else {
      folders = await Folder.find({ userId: auth.user._id }).sort({ order: 1, createdAt: 1 }).lean();
    }

    return ok({ data: { folders } });
  } catch (error) {
    console.error('Get folders error:', error);
    return fail('Error fetching folders');
  }
}

// POST /api/folders — create
export async function POST(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const { name, color = 'purple' } = await request.json();

    if (!name || !name.trim()) return fail('Folder name is required', 400);

    const existingFolder = await Folder.findOne({ userId: auth.user._id, name: name.trim() });
    if (existingFolder) return fail('Folder with this name already exists', 400);

    const maxOrderFolder = await Folder.findOne({ userId: auth.user._id }).sort({ order: -1 });
    const newOrder = maxOrderFolder ? maxOrderFolder.order + 1 : 0;

    const folder = await Folder.create({
      name: name.trim(),
      color,
      userId: auth.user._id,
      order: newOrder,
    });

    return ok({ message: 'Folder created successfully', data: { folder } }, 201);
  } catch (error) {
    console.error('Create folder error:', error);
    if (error.message && error.message.includes('Maximum folder limit')) {
      return fail(error.message, 400);
    }
    return fail('Error creating folder');
  }
}
