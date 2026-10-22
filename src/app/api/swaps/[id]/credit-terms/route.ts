import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { badRequest, forbidden, internalError, notFound, ok, unauthorized } from '@/lib/api-response';
import { creditTermsActionSchema } from '@/lib/validations/swap';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to respond to credit terms');

  const supabase = getAdminClient();
  const { data: swap, error } = await supabase
    .from('swap_requests')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (error || !swap) return notFound('Swap request not found');
  if (swap.credit_difference <= 0) return badRequest('VALIDATION_ERROR', 'Equal-night swaps do not need credit terms');
  if (swap.credit_recipient_id !== user.id) {
    return forbidden('Only the member earning the difference can respond to these credit terms');
  }
  if (!['pending', 'countered'].includes(swap.credit_terms_status)) {
    return badRequest('INVALID_STATE_TRANSITION', `Credit terms are already ${swap.credit_terms_status}`);
  }

  const parsed = creditTermsActionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('VALIDATION_ERROR', 'Invalid credit terms response', parsed.error.format());

  const nextStatus = parsed.data.action === 'accept'
    ? 'accepted'
    : parsed.data.action === 'counter'
      ? 'countered'
      : parsed.data.action === 'return_stay'
        ? 'return_stay'
        : 'declined';
  const { data: updated, error: updateError } = await supabase
    .from('swap_requests')
    .update({ credit_terms_status: nextStatus, credit_terms_note: parsed.data.note ?? null, updated_at: new Date().toISOString() })
    .eq('id', swap.id)
    .select()
    .single();
  if (updateError || !updated) return internalError('Failed to update credit terms', updateError?.message);
  return ok(updated);
}
