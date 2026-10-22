import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, forbidden, notFound, badRequest, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

// POST /api/swaps/:id/decline - Decline proposed swap
export async function POST(req: NextRequest, { params }: RouteContext) {
  const swapId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to decline a swap');
  }

  const supabase = getAdminClient();

  const { data: swap, error } = await supabase
    .from('swap_requests')
    .select('*')
    .eq('id', swapId)
    .maybeSingle();

  if (error || !swap) {
    return notFound('Swap request not found');
  }

  // Must be either requester or recipient
  if (swap.requester_id !== user.id && swap.recipient_id !== user.id && user.role !== 'admin') {
    return forbidden('You are not a participant in this swap proposal');
  }

  if (swap.request_status === 'confirmed') {
    return badRequest('INVALID_STATE_TRANSITION', 'Cannot decline an already confirmed swap. Use cancellation workflow.');
  }

  const newStatus = user.id === swap.requester_id ? 'cancelled' : 'declined';

  const { data: updated, error: updateError } = await supabase
    .from('swap_requests')
    .update({
      request_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', swapId)
    .select()
    .single();

  if (updateError) {
    return internalError('Failed to update swap status', updateError.message);
  }

  return ok(updated);
}
