import { connectDB } from '@/lib/db';
import Note from '@/lib/models/Note';
import ChatMessage from '@/lib/models/ChatMessage';
import { getAuthUser } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';
import { retrieveContext } from '@/lib/graph/retrieve';
import { stripHtml } from '@/utils/helpers';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const createAIPrompt = (userMessage, ctx, hasImages, knownFacts) => {
  const factsBlock = knownFacts ? `\n\n${knownFacts}` : '';
  const noteBlock = `Note Context (for reference):
Title: ${ctx.title || 'Untitled'}
Content: ${ctx.content || 'No content'}
Keywords: ${ctx.keywords ? ctx.keywords.join(', ') : 'None'}${factsBlock}`;

  if (hasImages) {
    return `You are an AI assistant that can analyze images and help with various tasks. The user has uploaded an image and may also have some note context.

${noteBlock}

User Question: ${userMessage}

Please analyze the uploaded image(s) and respond to the user's question.`;
  }
  return `You are an AI assistant that can help with various questions and tasks. The user may ask general questions or questions related to their note content.

${noteBlock}

User Question: ${userMessage}

Please provide a helpful response. Prefer the "Known facts" when they are relevant (they may include facts from related notes). If the question is general knowledge, answer it directly. Be concise and helpful.`;
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
    if (!process.env.GEMINI_API_KEY) return fail('AI service is not configured. Set GEMINI_API_KEY.', 503);

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

    // Retrieve the relevant knowledge-graph subgraph (best-effort).
    let retrieval = { block: '', count: 0, ms: 0 };
    try {
      retrieval = await retrieveContext({ userId: auth.user._id, note, question: message });
    } catch (e) {
      console.error('graph retrieval failed (continuing without it):', e.message);
    }

    // Build Gemini request parts (text prompt + any images). Strip HTML so inline
    // images/markup don't bloat the prompt.
    const hasImages = images && images.length > 0;
    const parts = [];
    const promptText = message && message.trim() ? message : 'Analyze the uploaded image(s).';
    parts.push({
      text: createAIPrompt(
        promptText,
        { title: note.title, content: stripHtml(note.content || ''), keywords: note.keywords },
        hasImages,
        retrieval.block
      ),
    });
    if (hasImages) {
      images.forEach((image) => parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } }));
    }

    let aiResponseText = await generateContent(parts);
    if (!aiResponseText) aiResponseText = 'The AI returned an empty response. Try rephrasing.';
    const responseTime = Date.now() - startTime;

    const aiMessage = await ChatMessage.create({
      noteId: note._id,
      userId: auth.user._id,
      sessionId,
      type: 'ai',
      content: aiResponseText,
      metadata: { model: MODEL, responseTime, factsUsed: retrieval.count, retrievalMs: retrieval.ms },
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
    if (error.status === 429 || /quota|rate limit/i.test(msg)) {
      return fail('AI quota exceeded — check your Gemini plan at ai.dev/rate-limit.', 429);
    }
    if (error.status === 400 || error.status === 403 || /api key|permission|invalid/i.test(msg)) {
      return fail(`AI key error: ${msg}`, 503);
    }
    return fail(`AI error: ${msg}`, 500);
  }
}
