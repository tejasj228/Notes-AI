import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function () {
        return this.loginMethod === 'email';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    loginMethod: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    googleId: { type: String, sparse: true },
    avatar: { type: String, default: null },
    isVerified: { type: Boolean, default: true },
    lastLogin: { type: Date, default: Date.now },
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      defaultNoteColor: {
        type: String,
        enum: ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'],
        default: 'purple',
      },
      defaultNoteSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

export default mongoose.models.User || mongoose.model('User', userSchema);
