import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, forbidden, internalError } from '@/lib/api-response';

// GET /api/admin/reports - Admin moderation of reports
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required');
  }

  if (user.role !== 'admin') {
    return forbidden('Admin privilege required to view moderation reports');
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'open';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;

  const supabase = getAdminClient();

  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id (id, display_name, verification_status)
    `, { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: reports, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return internalError('Failed to fetch admin reports', error.message);
  }

  return ok(reports || [], { total: count || 0, page, limit });
}
