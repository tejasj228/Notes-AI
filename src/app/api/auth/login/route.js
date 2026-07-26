import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request) {
  try {
    await connectDB();
    const { email, password, loginMethod = 'email' } = await request.json();

    if (!email) return fail('Email is required', 400);
    if (loginMethod === 'email' && !password) return fail('Password is required', 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) return fail('Invalid email or password', 401);

    if (loginMethod === 'email') {
      const isPasswordCorrect = await user.correctPassword(password);
      if (!isPasswordCorrect) return fail('Invalid email or password', 401);
    }

    await user.updateLastLogin();
    const token = generateToken(user._id);

    return ok({
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          loginMethod: user.loginMethod,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return fail('Error logging in');
  }
}
