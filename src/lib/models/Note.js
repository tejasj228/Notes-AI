import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
      default: 'Untitled Note',
    },
    content: { type: String, default: '', maxlength: [10000000, 'Content too long'] },
    keywords: [{ type: String, trim: true, maxlength: [50, 'Keyword too long'] }],
    color: {
      type: String,
      enum: ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'],
      default: 'purple',
    },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    order: { type: Number, default: 0 },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: false },
        filename: { type: String, required: true },
        size: { type: Number, required: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPinned: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    lastEditedAt: { type: Date, default: Date.now },
    // Hash of title+content at last knowledge-graph extraction — lets us skip
    // re-extracting unchanged notes.
    graphIndexedHash: { type: String, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

noteSchema.index({ userId: 1, isTrashed: 1 });
noteSchema.index({ userId: 1, folderId: 1, isTrashed: 1 });
noteSchema.index({ userId: 1, isTrashed: 1, order: 1 });
noteSchema.index({ userId: 1, isTrashed: 1, updatedAt: -1 });

noteSchema.pre('save', function (next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.lastEditedAt = new Date();
  }
  next();
});

noteSchema.methods.moveToTrash = function () {
  this.isTrashed = true;
  this.trashedAt = new Date();
  return this.save();
};

noteSchema.methods.restoreFromTrash = function () {
  this.isTrashed = false;
  this.trashedAt = null;
  return this.save();
};

noteSchema.methods.permanentDelete = function () {
  return this.deleteOne();
};

export default mongoose.models.Note || mongoose.model('Note', noteSchema);
