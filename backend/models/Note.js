const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
    default: 'Untitled Note'
  },
  content: {
    type: String,
    default: '',
    maxlength: [10000000, 'Content cannot be more than 10000000 characters']
  },
  keywords: [{
    type: String,
    trim: true,
    maxlength: [50, 'Keyword cannot be more than 50 characters']
  }],
  color: {
    type: String,
    enum: ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'],
    default: 'purple'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  order: {
    type: Number,
    default: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String, // For Cloudinary
      required: false
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number, // File size in bytes
      required: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isTrashed: {
    type: Boolean,
    default: false
  },
  trashedAt: {
    type: Date,
    default: null
  },
  lastEditedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance - optimized for common queries
noteSchema.index({ userId: 1, isTrashed: 1 });
noteSchema.index({ userId: 1, folderId: 1, isTrashed: 1 });
noteSchema.index({ userId: 1, isPinned: 1, isTrashed: 1 });
noteSchema.index({ userId: 1, isTrashed: 1, order: 1 }); // For ordering
noteSchema.index({ userId: 1, isTrashed: 1, updatedAt: -1 }); // For recent notes
noteSchema.index({ title: 'text', content: 'text', keywords: 'text' }); // Text search

// Compound index for folder + order queries
noteSchema.index({ userId: 1, folderId: 1, isTrashed: 1, order: 1 });

// Sparse indexes for better performance
noteSchema.index({ trashedAt: 1 }, { sparse: true });
noteSchema.index({ 'images.uploadedAt': -1 }, { sparse: true });

// Virtual for word count
noteSchema.virtual('wordCount').get(function() {
  if (!this.content) return 0;
  return this.content.split(/\s+/).filter(word => word.length > 0).length;
});

// Virtual for character count
noteSchema.virtual('characterCount').get(function() {
  return this.content ? this.content.length : 0;
});

// Virtual for folder name (populated)
noteSchema.virtual('folderName', {
  ref: 'Folder',
  localField: 'folderId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update lastEditedAt
noteSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.lastEditedAt = new Date();
  }
  next();
});

// Instance method to move to trash
noteSchema.methods.moveToTrash = function() {
  this.isTrashed = true;
  this.trashedAt = new Date();
  return this.save();
};

// Instance method to restore from trash
noteSchema.methods.restoreFromTrash = function() {
  this.isTrashed = false;
  this.trashedAt = null;
  return this.save();
};

// Instance method to permanently delete
noteSchema.methods.permanentDelete = function() {
  return this.deleteOne();
};

// Static method to find user's notes
noteSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isTrashed: false };
  
  if (options.folderId !== undefined) {
    query.folderId = options.folderId;
  }
  
  if (options.isPinned !== undefined) {
    query.isPinned = options.isPinned;
  }
  
  return this.find(query).sort({ order: 1, updatedAt: -1 });
};

// Static method to search notes
noteSchema.statics.searchNotes = function(userId, searchTerm) {
  return this.find({
    userId,
    isTrashed: false,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { content: { $regex: searchTerm, $options: 'i' } },
      { keywords: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  }).sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Note', noteSchema);
