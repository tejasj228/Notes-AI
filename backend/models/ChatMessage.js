const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: false,
    maxlength: [5000, 'Message content cannot be more than 5000 characters'],
    default: ''
  },
  context: {
    noteTitle: String,
    noteContent: String,
    noteKeywords: [String]
  },
  metadata: {
    model: {
      type: String,
      default: 'gemini-1.5-flash'
    },
    tokens: {
      input: Number,
      output: Number
    },
    responseTime: Number, // in milliseconds
    images: [{
      base64: String,
      mimeType: String,
      name: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for performance - comprehensive coverage
chatMessageSchema.index({ noteId: 1, createdAt: -1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ noteId: 1, userId: 1, createdAt: -1 });
chatMessageSchema.index({ noteId: 1, sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: 1 });

// Critical compound indexes for common queries
chatMessageSchema.index({ noteId: 1, userId: 1, sessionId: 1 }); // For specific session queries
chatMessageSchema.index({ userId: 1, noteId: 1, createdAt: -1 }); // For user's note history
chatMessageSchema.index({ sessionId: 1, createdAt: 1 }); // For session message ordering

// Sparse index for better performance on optional fields
chatMessageSchema.index({ 'metadata.model': 1 }, { sparse: true });
chatMessageSchema.index({ 'metadata.images': 1 }, { sparse: true });

// Static method to get chat history for a note
chatMessageSchema.statics.getChatHistory = function(noteId, userId, limit = 50) {
  return this.find({ noteId, userId })
    .sort({ createdAt: 1 }) // Oldest first for conversation flow
    .limit(limit)
    .lean();
};

// Static method to get recent chats for user
chatMessageSchema.statics.getRecentChats = function(userId, limit = 20) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$noteId',
        lastMessage: { $first: '$$ROOT' },
        messageCount: { $sum: 1 }
      }
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'notes',
        localField: '_id',
        foreignField: '_id',
        as: 'note'
      }
    },
    { $unwind: '$note' },
    {
      $project: {
        noteId: '$_id',
        noteTitle: '$note.title',
        lastMessage: '$lastMessage.content',
        lastMessageType: '$lastMessage.type',
        lastMessageAt: '$lastMessage.createdAt',
        messageCount: 1
      }
    }
  ]);
};

// Instance method to add context
chatMessageSchema.methods.addContext = function(note) {
  this.context = {
    noteTitle: note.title,
    noteContent: note.content.substring(0, 1000), // Limit context size
    noteKeywords: note.keywords
  };
  return this;
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
