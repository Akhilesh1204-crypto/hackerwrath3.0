import { NextRequest } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export interface AuthUser {
  id: string;
  email?: string;
  role: 'member' | 'admin';
}

/**
 * Extracts and verifies the authenticated user from cookies or Authorization Bearer header.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  // 1. Try Bearer token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const supabaseAdmin = getAdminClient();
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Fetch user profile role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || 'member',
    };
  }

  // 2. Try cookie session via createClientServer
  try {
    const supabase = await createClientServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || 'member',
    };
  } catch (err) {
    // continue to fallback
  }

  // 3. Development / Demo Switcher header support
  const devUserId = req.headers.get('x-user-id');
  if (devUserId) {
    const supabaseAdmin = getAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', devUserId)
      .maybeSingle();

    if (profile) {
      return {
        id: profile.id,
        role: profile.role || 'member',
      };
    }
  }

  return null;
}
