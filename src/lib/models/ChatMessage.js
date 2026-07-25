import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, index: true },
    type: { type: String, enum: ['user', 'ai'], required: true },
    content: {
      type: String,
      required: false,
      maxlength: [5000, 'Message content cannot be more than 5000 characters'],
      default: '',
    },
    context: {
      noteTitle: String,
      noteContent: String,
      noteKeywords: [String],
    },
    metadata: {
      model: { type: String, default: 'gemini-1.5-flash' },
      tokens: { input: Number, output: Number },
      responseTime: Number,
      images: [{ base64: String, mimeType: String, name: String }],
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ noteId: 1, userId: 1, sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ noteId: 1, userId: 1, createdAt: -1 });

chatMessageSchema.methods.addContext = function (note) {
  this.context = {
    noteTitle: note.title,
    noteContent: (note.content || '').substring(0, 1000),
    noteKeywords: note.keywords,
  };
  return this;
};

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);
