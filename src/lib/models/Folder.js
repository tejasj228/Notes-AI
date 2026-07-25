import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot be more than 100 characters'],
    },
    color: {
      type: String,
      enum: ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'],
      default: 'purple',
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

folderSchema.index({ userId: 1, order: 1 });
folderSchema.index({ userId: 1, name: 1 }, { unique: true });

// Enforce a max of 10 folders per user
folderSchema.pre('save', async function (next) {
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

// Delete folder and move its notes back to root
folderSchema.methods.deleteWithNotesHandling = async function () {
  const Note = mongoose.models.Note || mongoose.model('Note');
  await Note.updateMany(
    { folderId: this._id, isTrashed: false },
    { $set: { folderId: null } }
  );
  return this.deleteOne();
};

export default mongoose.models.Folder || mongoose.model('Folder', folderSchema);
