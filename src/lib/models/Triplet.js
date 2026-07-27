import mongoose from 'mongoose';

const endpointSchema = new mongoose.Schema(
  {
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
    text: { type: String, required: true },
  },
  { _id: false }
);

const tripletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
    subject: { type: endpointSchema, required: true },
    relation: { type: String, required: true, trim: true },
    object: { type: endpointSchema, required: true },
    // Natural-language rendering of the fact — what we embed and show to the LLM.
    fact: { type: String, required: true },
    embedding: { type: [Number], default: undefined }, // 768-d
    metadata: {
      time: { type: String, default: null }, // any temporal info in the note
      confidence: { type: Number, default: 0.7 },
      sourceSpan: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

tripletSchema.index({ userId: 1, noteId: 1 });
tripletSchema.index({ userId: 1 });
tripletSchema.index({ 'subject.entityId': 1 });
tripletSchema.index({ 'object.entityId': 1 });

export default mongoose.models.Triplet || mongoose.model('Triplet', tripletSchema);
