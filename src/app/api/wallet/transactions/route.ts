import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, internalError } from '@/lib/api-response';

// GET /api/wallet/transactions - List member's transaction history
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to view transaction history');
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;

  const supabase = getAdminClient();

  const { data: transactions, count, error } = await supabase
    .from('credit_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return internalError('Failed to fetch transaction history', error.message);
  }

  return ok(transactions || [], { total: count || 0, page, limit });
}
