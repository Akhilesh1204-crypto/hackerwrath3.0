import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { updateProfileSchema } from '@/lib/validations/profile';
import { ok, unauthorized, notFound, badRequest, internalError } from '@/lib/api-response';

// GET /api/profile - Fetch current user's full profile
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to view profile');
  }

  const supabase = getAdminClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) {
    return notFound('Profile not found');
  }

  return ok(profile);
}

// PATCH /api/profile - Update current user's profile details
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to update profile');
  }

  try {
    const json = await req.json();
    const result = updateProfileSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid profile update data', result.error.format());
    }

    const supabase = getAdminClient();
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return internalError('Failed to update profile', error.message);
    }

    return ok(updated);
  } catch (err: any) {
    return internalError('Server error updating profile', err?.message);
  }
}
