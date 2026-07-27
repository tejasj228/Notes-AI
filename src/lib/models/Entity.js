import mongoose from 'mongoose';

const ENTITY_TYPES = ['person', 'place', 'org', 'concept', 'date', 'event', 'thing', 'other'];

const entitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true }, // display name
    normalized: { type: String, required: true }, // lowercased key for dedupe
    type: { type: String, enum: ENTITY_TYPES, default: 'other' },
    aliases: [{ type: String }],
    embedding: { type: [Number], default: undefined }, // 768-d, optional
    noteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
    mentionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One canonical entity per (user, normalized name) — powers find-or-create resolution.
entitySchema.index({ userId: 1, normalized: 1 }, { unique: true });

export const ENTITY_TYPE_LIST = ENTITY_TYPES;
export default mongoose.models.Entity || mongoose.model('Entity', entitySchema);
