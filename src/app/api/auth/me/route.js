import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  const user = auth.user;
  return ok({
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    },
  });
}
