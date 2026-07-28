import mongoose from 'mongoose';

// Register ALL models on import so that .populate('folderId') and other cross-model
// refs resolve in every serverless instance (otherwise Mongoose throws
// "Schema hasn't been registered for model 'Folder'" on cold lambdas).
import './models/User';
import './models/Folder';
import './models/Note';
import './models/ChatMessage';
import './models/Entity';
import './models/Triplet';

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
    // querySrv/ECONNREFUSED/ENOTFOUND here almost always means THIS network
    // can't resolve or reach MongoDB's DNS SRV record — common on campus/office
    // WiFi and some routers that block SRV-type DNS queries. It is not a bug in
    // the app (the deployed site is unaffected, since Vercel's network isn't
    // restricted this way) — surface a message that says so instead of a raw
    // driver error.
    if (/querySrv|ECONNREFUSED|ENOTFOUND|ETIMEOUT/i.test(err.message || '')) {
      const friendly = new Error(
        `Can't reach the database from this network (${err.message}). This is almost always local network/DNS blocking MongoDB Atlas's SRV lookup — common on campus or office WiFi. Try: switching your DNS to 8.8.8.8 / 1.1.1.1, a mobile hotspot, or a VPN. The deployed site is unaffected by this.`
      );
      friendly.status = 503;
      throw friendly;
    }
    throw err;
  }

  return cached.conn;
}
