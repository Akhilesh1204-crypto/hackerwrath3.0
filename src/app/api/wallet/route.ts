import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, internalError } from '@/lib/api-response';
import { WalletSummaryResponse } from '@/types/api';

// GET /api/wallet - Get current user's wallet balances
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to view wallet');
  }

  const supabase = getAdminClient();

  const { data: account, error } = await supabase
    .from('credit_accounts')
    .select('available_balance, reserved_balance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return internalError('Failed to fetch wallet information', error.message);
  }

  const available = account?.available_balance ?? 0;
  const reserved = account?.reserved_balance ?? 0;

  const walletSummary: WalletSummaryResponse = {
    available_balance: available,
    reserved_balance: reserved,
    total_balance: available + reserved,
  };

  return ok(walletSummary);
}
