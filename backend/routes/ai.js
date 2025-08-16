const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Note = require('../models/Note');
const ChatMessage = require('../models/ChatMessage');
const { checkResourceOwnership, authenticateToken } = require('../middleware/auth');
const { createCacheMiddleware, keyGenerators, invalidateChatCache } = require('../middleware/cache');

const router = express.Router();

// Initialize Google Generative AI
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn('⚠️  GEMINI_API_KEY not found. AI features will be disabled.');
}

// Helper function to create AI prompt
const createAIPrompt = (userMessage, noteContext, hasImages = false) => {
  if (hasImages) {
    // More flexible prompt when images are involved
    return `You are an AI assistant that can analyze images and help with various tasks. The user has uploaded an image and may also have some note context.

Note Context (for reference):
Title: ${noteContext.title || 'Untitled'}
Content: ${noteContext.content || 'No content'}
Keywords: ${noteContext.keywords ? noteContext.keywords.join(', ') : 'None'}

User Question: ${userMessage}

Please analyze the uploaded image(s) and respond to the user's question. You can discuss anything about the image content, provide explanations, answer questions, or help with tasks related to what you see. If the user's question relates to both the image and the note content, feel free to discuss both.`;
  } else {
    // More flexible prompt for text conversations - can answer general questions but prioritize note context when relevant
    return `You are an AI assistant that can help with various questions and tasks. The user may ask general questions or questions related to their note content.

Note Context (for reference):
Title: ${noteContext.title || 'Untitled'}
Content: ${noteContext.content || 'No content'}
Keywords: ${noteContext.keywords ? noteContext.keywords.join(', ') : 'None'}

User Question: ${userMessage}

Please provide a helpful response. If the question is general knowledge or unrelated to the note, feel free to answer it directly. If the question relates to the note content or could benefit from the note context, incorporate that information. Be concise, relevant, and helpful.`;
  }
};

// @desc    Send message to AI about a specific note
// @route   POST /api/ai/chat/:noteId
// @access  Private
router.post('/chat/:noteId', checkResourceOwnership(Note, 'noteId'), async (req, res) => {
  try {
    const { message, images, sessionId } = req.body;
    const note = req.resource;

    if ((!message || !message.trim()) && (!images || images.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message or images are required'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please set GEMINI_API_KEY.'
      });
    }

    const startTime = Date.now();

    // Save user message
    const messageContent = (message && message.trim()) ? message.trim() : (images && images.length > 0 ? '[Image uploaded]' : '[Empty message]');
    
    const userMessage = await ChatMessage.create({
      noteId: note._id,
      userId: req.user._id,
      sessionId: sessionId,
      type: 'user',
      content: messageContent,
      metadata: {
        images: images || []
      }
    });

    userMessage.addContext(note);
    await userMessage.save();

    // Generate AI response
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare content for Gemini (text + images)
    const content = [];
    const hasImages = images && images.length > 0;
    
    // Add text prompt
    if (message && message.trim()) {
      content.push(createAIPrompt(message, {
        title: note.title,
        content: note.content,
        keywords: note.keywords
      }, hasImages));
    } else if (hasImages) {
      content.push(createAIPrompt("Analyze the uploaded image(s).", {
        title: note.title,
        content: note.content,
        keywords: note.keywords
      }, hasImages));
    }
    
    // Add images
    if (images && images.length > 0) {
      images.forEach(image => {
        content.push({
          inlineData: {
            data: image.base64,
            mimeType: image.mimeType
          }
        });
      });
    }

    const result = await model.generateContent(content);
    const response = await result.response;
    const aiResponseText = response.text();

    const responseTime = Date.now() - startTime;

    // Calculate input length for tokens (text content only)
    const textContent = content.filter(item => typeof item === 'string').join(' ');
    const inputLength = textContent.length;

    // Save AI response
    const aiMessage = await ChatMessage.create({
      noteId: note._id,
      userId: req.user._id,
      sessionId: sessionId,
      type: 'ai',
      content: aiResponseText,
      metadata: {
        model: 'gemini-1.5-flash',
        responseTime,
        tokens: {
          input: inputLength,
          output: aiResponseText.length
        }
      }
    });

    aiMessage.addContext(note);
    await aiMessage.save();

    res.json({
      success: true,
      data: {
        userMessage: {
          id: userMessage._id,
          content: userMessage.content,
          type: 'user',
          createdAt: userMessage.createdAt
        },
        aiMessage: {
          id: aiMessage._id,
          content: aiMessage.content,
          type: 'ai',
          createdAt: aiMessage.createdAt,
          metadata: aiMessage.metadata
        }
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    if (error.message.includes('API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service configuration error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing AI request'
    });
  }
});

// @desc    Get chat history for a note
// @route   GET /api/ai/chat/:noteId/history
// @access  Private
router.get('/chat/:noteId/history', 
  checkResourceOwnership(Note, 'noteId'), 
  createCacheMiddleware(require('../middleware/cache').chatCache, keyGenerators.chatHistory, 60), // 1 minute cache
  async (req, res) => {
  try {
    const { limit = 50, skip = 0, sessionId } = req.query;
    const noteId = req.params.noteId;

    console.log('Get chat history request:', { noteId, sessionId, userId: req.user._id });

    if (sessionId) {
      // Get messages for a specific session - highly optimized query
      const messages = await ChatMessage.find({
        noteId,
        userId: req.user._id,
        sessionId
      }, {
        // Select only essential fields for faster transfer
        content: 1,
        type: 1,
        createdAt: 1,
        'metadata.images': 1
      })
        .sort({ createdAt: 1 }) // Oldest first for conversation flow
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean(); // Use lean for 3x faster queries

      console.log(`Found ${messages.length} messages for session ${sessionId}`);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            total: messages.length,
            limit: parseInt(limit),
            skip: parseInt(skip),
            hasMore: messages.length === parseInt(limit)
          }
        }
      });
    } else {
      // Get all sessions for this note - ultra-optimized aggregation
      const sessions = await ChatMessage.aggregate([
        {
          $match: {
            noteId: new mongoose.Types.ObjectId(noteId),
            userId: new mongoose.Types.ObjectId(req.user._id)
          }
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
                $cond: [
                  { $gt: [{ $size: { $ifNull: ['$metadata.images', []] } }, 0] },
                  true,
                  false
                ]
              }
            }
          }
        },
        {
          $sort: { updatedAt: -1 } // Most recent sessions first
        },
        {
          $limit: parseInt(limit)
        },
        {
          $skip: parseInt(skip)
        }
      ]).allowDiskUse(true); // Allow disk use for large datasets

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            total: sessions.length,
            limit: parseInt(limit),
            skip: parseInt(skip),
            hasMore: sessions.length === parseInt(limit)
          }
        }
      });
    }
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history'
    });
  }
});

// @desc    Delete chat history for a note
// @route   DELETE /api/ai/chat/:noteId/history
// @access  Private
router.delete('/chat/:noteId/history', checkResourceOwnership(Note, 'noteId'), async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { sessionId } = req.query;

    console.log('Delete chat request:', { noteId, sessionId, userId: req.user._id });

    let filter = {
      noteId,
      userId: req.user._id
    };

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    console.log('Delete filter:', filter);

    const result = await ChatMessage.deleteMany(filter);

    console.log('Delete result:', result);

    res.json({
      success: true,
      message: sessionId 
        ? `Chat session deleted (${result.deletedCount} messages)`
        : `${result.deletedCount} chat messages deleted`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Delete chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat history: ' + error.message
    });
  }
});

// @desc    Get AI suggestions for note improvement
// @route   POST /api/ai/suggestions/:noteId
// @access  Private
router.post('/suggestions/:noteId', checkResourceOwnership(Note, 'noteId'), async (req, res) => {
  try {
    const note = req.resource;
    const { type = 'general' } = req.body; // general, keywords, structure, expand

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured'
      });
    }

    let prompt;
    switch (type) {
      case 'keywords':
        prompt = `Analyze this note and suggest 3-5 relevant keywords/tags:

Title: ${note.title}
Content: ${note.content}

Provide only the keywords as a comma-separated list.`;
        break;
        
      case 'structure':
        prompt = `Suggest how to better structure and organize this note:

Title: ${note.title}
Content: ${note.content}

Provide specific suggestions for improving organization and readability.`;
        break;
        
      case 'expand':
        prompt = `Suggest additional topics or sections that could expand this note:

Title: ${note.title}
Content: ${note.content}

Provide 3-5 specific suggestions for additional content or related topics.`;
        break;
        
      default:
        prompt = `Analyze this note and provide general improvement suggestions:

Title: ${note.title}
Content: ${note.content}

Provide helpful suggestions for enhancing the content, structure, or usefulness of this note.`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text();

    res.json({
      success: true,
      data: {
        type,
        suggestions,
        noteId: note._id
      }
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating AI suggestions'
    });
  }
});

// @desc    Get recent chat activity
// @route   GET /api/ai/recent-chats
// @access  Private
router.get('/recent-chats', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentChats = await ChatMessage.getRecentChats(req.user._id, parseInt(limit));

    res.json({
      success: true,
      data: {
        recentChats
      }
    });
  } catch (error) {
    console.error('Get recent chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent chats'
    });
  }
});

// @desc    Get AI usage statistics
// @route   GET /api/ai/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await ChatMessage.aggregate([
      {
        $match: {
          userId: req.user._id
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: {
            $sum: { $cond: [{ $eq: ['$type', 'user'] }, 1, 0] }
          },
          aiMessages: {
            $sum: { $cond: [{ $eq: ['$type', 'ai'] }, 1, 0] }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $eq: ['$type', 'ai'] },
                '$metadata.responseTime',
                null
              ]
            }
          },
          firstMessage: { $min: '$createdAt' },
          lastMessage: { $max: '$createdAt' },
          uniqueNotes: { $addToSet: '$noteId' }
        }
      },
      {
        $project: {
          _id: 0,
          totalMessages: 1,
          userMessages: 1,
          aiMessages: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          firstMessage: 1,
          lastMessage: 1,
          uniqueNotesCount: { $size: '$uniqueNotes' }
        }
      }
    ]);

    const aiStats = stats[0] || {
      totalMessages: 0,
      userMessages: 0,
      aiMessages: 0,
      avgResponseTime: 0,
      firstMessage: null,
      lastMessage: null,
      uniqueNotesCount: 0
    };

    res.json({
      success: true,
      data: { stats: aiStats }
    });
  } catch (error) {
    console.error('Get AI stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI statistics'
    });
  }
});

module.exports = router;
