import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const { user: googleUser } = await request.json();

    if (!googleUser || !googleUser.email || !googleUser.displayName) {
      return fail('Google user data is required', 400);
    }

    let user = await User.findOne({ email: googleUser.email.toLowerCase().trim() });

    if (user) {
      if (googleUser.photoURL && user.avatar !== googleUser.photoURL) {
        user.avatar = googleUser.photoURL;
        await user.save();
      }
    } else {
      user = await User.create({
        name: googleUser.displayName || googleUser.name || 'Google User',
        email: googleUser.email.toLowerCase().trim(),
        loginMethod: 'google',
        googleId: googleUser.uid,
        avatar: googleUser.photoURL || null,
      });
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
          avatar: user.avatar,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return fail(error.message || 'Error with Google authentication');
  }
}
