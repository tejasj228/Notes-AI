import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Reuse the connection across hot-reloads (dev) and warm serverless invocations (prod)
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // Reuse only a live connection; a frozen/thawed serverless instance can hold a
  // dead one (readyState !== 1), in which case we reconnect.
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (dev) or your Vercel project env vars (prod).'
    );
  }

  // Drop a stale cached connection/promise before retrying.
  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
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
