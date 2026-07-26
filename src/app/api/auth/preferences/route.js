import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function PATCH(request) {
  const auth = await getAuthUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  try {
    await connectDB();
    const { theme, defaultNoteColor, defaultNoteSize } = await request.json();

    const updateData = {};
    if (theme) updateData['preferences.theme'] = theme;
    if (defaultNoteColor) updateData['preferences.defaultNoteColor'] = defaultNoteColor;
    if (defaultNoteSize) updateData['preferences.defaultNoteSize'] = defaultNoteSize;

    const user = await User.findByIdAndUpdate(
      auth.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return ok({ message: 'Preferences updated successfully', data: { preferences: user.preferences } });
  } catch (error) {
    console.error('Update preferences error:', error);
    return fail('Error updating preferences');
  }
}
