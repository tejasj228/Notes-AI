import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { json } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Public diagnostics — no secrets are returned, only presence + connection status.
// Visit /api/health on your deployment to see what's misconfigured.
export async function GET() {
  const env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  };

  let db = 'unknown';
  let dbError = null;
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    db = 'connected';
  } catch (e) {
    db = 'failed';
    dbError = e?.message || String(e);
  }

  return json({
    success: db === 'connected',
    env,
    db,
    dbError,
    readyState: mongoose.connection?.readyState ?? null, // 1 = connected
    time: new Date().toISOString(),
  });
}
