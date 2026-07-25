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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return { error: 'User not found', status: 401 };
    return { user };
  } catch (error) {
    if (error.name === 'TokenExpiredError') return { error: 'Token expired', status: 401 };
    if (error.name === 'JsonWebTokenError') return { error: 'Invalid token', status: 401 };
    return { error: 'Token verification failed', status: 500 };
  }
}
