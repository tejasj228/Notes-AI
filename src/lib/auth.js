import jwt from 'jsonwebtoken';
import { connectDB } from './db';
import User from './models/User';

export const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

// Verify the Bearer token and load the user.
// Returns { user } on success, or { error, status } on failure.
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return { error: 'Access token is missing or invalid', status: 401 };
  if (!process.env.JWT_SECRET) return { error: 'JWT_SECRET is not configured', status: 500 };

  // 1) Verify the token (auth failures are 401, not 500).
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') return { error: 'Token expired', status: 401 };
    return { error: 'Invalid token', status: 401 };
  }

  // 2) Hit the database (connection/query failures surface the real reason).
  try {
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return { error: 'User not found', status: 401 };
    return { user };
  } catch (error) {
    console.error('getAuthUser DB error:', error);
    return { error: `Database error: ${error.message}`, status: 503 };
  }
}
