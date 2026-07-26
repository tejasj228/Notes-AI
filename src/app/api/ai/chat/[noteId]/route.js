import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import ChatMessage from '@/lib/models/ChatMessage';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const createAIPrompt = (userMessage, ctx, hasImages) => {
  const noteBlock = `Note Context (for reference):
Title: ${ctx.title || 'Untitled'}
Content: ${ctx.content || 'No content'}
Keywords: ${ctx.keywords ? ctx.keywords.join(', ') : 'None'}`;

  if (hasImages) {
    return `You are an AI assistant that can analyze images and help with various tasks. The user has uploaded an image and may also have some note context.

${noteBlock}

User Question: ${userMessage}

Please analyze the uploaded image(s) and respond to the user's question.`;
  }
  return `You are an AI assistant that can help with various questions and tasks. The user may ask general questions or questions related to their note content.

${noteBlock}

User Question: ${userMessage}

Please provide a helpful response. If the question is general knowledge, answer it directly. If it relates to the note, incorporate that context. Be concise and helpful.`;
};

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

    const { message, images, sessionId } = await request.json();

    if ((!message || !message.trim()) && (!images || images.length === 0)) {
      return fail('Message or images are required', 400);
    }
    if (!sessionId) return fail('Session ID is required', 400);
    if (!genAI) return fail('AI service is not configured. Please set GEMINI_API_KEY.', 503);

    const startTime = Date.now();
    const messageContent =
      message && message.trim() ? message.trim() : images && images.length > 0 ? '[Image uploaded]' : '[Empty message]';

    const userMessage = await ChatMessage.create({
      noteId: note._id,
      userId: auth.user._id,
      sessionId,
      type: 'user',
      content: messageContent,
      metadata: { images: images || [] },
    });
    userMessage.addContext(note);
    await userMessage.save();

    const model = genAI.getGenerativeModel({ model: MODEL });
    const hasImages = images && images.length > 0;
    const content = [];

    if (message && message.trim()) {
      content.push(createAIPrompt(message, { title: note.title, content: note.content, keywords: note.keywords }, hasImages));
    } else if (hasImages) {
      content.push(createAIPrompt('Analyze the uploaded image(s).', { title: note.title, content: note.content, keywords: note.keywords }, hasImages));
    }
    if (hasImages) {
      images.forEach((image) => content.push({ inlineData: { data: image.base64, mimeType: image.mimeType } }));
    }

    const result = await model.generateContent(content);
    const aiResponseText = result.response.text();
    const responseTime = Date.now() - startTime;
    const inputLength = content.filter((c) => typeof c === 'string').join(' ').length;

    const aiMessage = await ChatMessage.create({
      noteId: note._id,
      userId: auth.user._id,
      sessionId,
      type: 'ai',
      content: aiResponseText,
      metadata: { model: MODEL, responseTime, tokens: { input: inputLength, output: aiResponseText.length } },
    });
    aiMessage.addContext(note);
    await aiMessage.save();

    return ok({
      data: {
        userMessage: { id: userMessage._id, content: userMessage.content, type: 'user', createdAt: userMessage.createdAt },
        aiMessage: {
          id: aiMessage._id,
          content: aiMessage.content,
          type: 'ai',
          createdAt: aiMessage.createdAt,
          metadata: aiMessage.metadata,
        },
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    const msg = error?.message || 'Error processing AI request';
    // Surface the real reason so it's diagnosable from the chat bubble.
    if (/quota|rate limit|429/i.test(msg)) {
      return fail('AI quota exceeded — check your Gemini plan/billing at ai.dev/rate-limit.', 429);
    }
    if (/api[_ ]?key|permission|401|403|invalid/i.test(msg)) {
      return fail(`AI key error: ${msg}`, 503);
    }
    return fail(`AI error: ${msg}`, 500);
  }
}
