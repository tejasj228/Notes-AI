import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import ChatMessage from '@/lib/models/ChatMessage';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function assertOwnsNote(noteId, userId) {
  const note = await Note.findById(noteId).select('_id userId');
  if (!note) return { error: 'Resource not found', status: 404 };
  if (note.userId.toString() !== userId.toString())
    return { error: 'Access denied: You do not own this resource', status: 403 };
  return {};
}

// GET /api/ai/chat/:noteId/history — sessions list, or messages for a session
export async function GET(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { noteId } = await params;

  try {
    await connectDB();
    const check = await assertOwnsNote(noteId, auth.user._id);
    if (check.error) return fail(check.error, check.status);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    if (sessionId) {
      const messages = await ChatMessage.find(
        { noteId, userId: auth.user._id, sessionId },
        { content: 1, type: 1, createdAt: 1, 'metadata.images': 1 }
      )
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return ok({ data: { messages, pagination: { limit, skip, hasMore: messages.length === limit } } });
    }

    const sessions = await ChatMessage.aggregate([
      {
        $match: {
          noteId: new mongoose.Types.ObjectId(noteId),
          userId: new mongoose.Types.ObjectId(auth.user._id),
        },
      },
      {
        $group: {
          _id: '$sessionId',
          sessionId: { $first: '$sessionId' },
          firstMessage: { $first: '$content' },
          lastMessage: { $last: '$content' },
          messageCount: { $sum: 1 },
          createdAt: { $min: '$createdAt' },
          updatedAt: { $max: '$createdAt' },
          hasImages: {
            $max: {
              $cond: [{ $gt: [{ $size: { $ifNull: ['$metadata.images', []] } }, 0] }, true, false],
            },
          },
        },
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]).allowDiskUse(true);

    return ok({ data: { sessions, pagination: { limit, skip, hasMore: sessions.length === limit } } });
  } catch (error) {
    console.error('Get chat history error:', error);
    return fail('Error fetching chat history');
  }
}

// DELETE /api/ai/chat/:noteId/history — delete a session (or all)
export async function DELETE(request, { params }) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);
  const { noteId } = await params;

  try {
    await connectDB();
    const check = await assertOwnsNote(noteId, auth.user._id);
    if (check.error) return fail(check.error, check.status);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const filter = { noteId, userId: auth.user._id };
    if (sessionId) filter.sessionId = sessionId;

    const result = await ChatMessage.deleteMany(filter);

    return ok({
      message: sessionId
        ? `Chat session deleted (${result.deletedCount} messages)`
        : `${result.deletedCount} chat messages deleted`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error('Delete chat history error:', error);
    return fail('Error deleting chat history: ' + error.message);
  }
}
