import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const { name, email, password, loginMethod = 'email' } = await request.json();

    if (!name || !email) return fail('Name and email are required', 400);
    if (loginMethod === 'email' && !password) return fail('Password is required for email signup', 400);
    if (password && password.length < 6) return fail('Password must be at least 6 characters', 400);

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return fail('User already exists with this email', 400);

    const userData = { name: name.trim(), email: email.toLowerCase().trim(), loginMethod };
    if (loginMethod === 'email') userData.password = password;

    const user = await User.create(userData);
    await user.updateLastLogin();
    const token = generateToken(user._id);

    return ok(
      {
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            loginMethod: user.loginMethod,
            preferences: user.preferences,
            createdAt: user.createdAt,
          },
          token,
        },
      },
      201
    );
  } catch (error) {
    console.error('Signup error:', error);
    return fail('Error creating user');
  }
}
