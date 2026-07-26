import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Reuse the connection across hot-reloads (dev) and warm serverless invocations (prod)
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (dev) or your Vercel project env vars (prod).'
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Smaller pool: serverless instances are single-request, big pools waste Atlas connections
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        family: 4,
        // Keep command buffering ON so queries wait for the connection instead of
        // throwing when concurrent cold-start requests race each other.
        bufferCommands: true,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
