const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [100, 'Folder name cannot be more than 100 characters']
  },
  color: {
    type: String,
    enum: ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'],
    default: 'purple'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
folderSchema.index({ userId: 1, order: 1 });
folderSchema.index({ userId: 1, name: 1 }, { unique: true }); // Prevent duplicate folder names per user

// Virtual for notes count
folderSchema.virtual('notesCount', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'folderId',
  count: true,
  match: { isTrashed: false }
});

// Pre-save middleware to ensure folder limit (max 10 folders per user)
folderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const folderCount = await this.constructor.countDocuments({ userId: this.userId });
    if (folderCount >= 10) {
      const error = new Error('Maximum folder limit reached (10 folders per user)');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// Static method to find user's folders
folderSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ order: 1, createdAt: 1 });
};

// Static method to get folder with notes count
folderSchema.statics.findByUserWithNotesCount = function(userId) {
  return this.find({ userId })
    .populate({
      path: 'notesCount',
      match: { isTrashed: false }
    })
    .sort({ order: 1, createdAt: 1 });
};

// Instance method to delete folder and move notes to root
folderSchema.methods.deleteWithNotesHandling = async function() {
  const Note = require('./Note');
  
  // Move all notes in this folder to root (folderId = null)
  await Note.updateMany(
    { folderId: this._id, isTrashed: false },
    { $unset: { folderId: 1 } }
  );
  
  // Delete the folder
  return this.deleteOne();
};

module.exports = mongoose.model('Folder', folderSchema);
