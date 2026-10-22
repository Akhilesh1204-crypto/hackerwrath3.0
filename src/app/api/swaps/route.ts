import { NextRequest } from 'next/server';
import { getAuthUser, isVerifiedMember } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { createSwapRequestSchema } from '@/lib/validations/swap';
import { calculateNights } from '@/lib/services/dates';
import { ok, unauthorized, badRequest, notFound, conflict, internalError } from '@/lib/api-response';

// POST /api/swaps - Create swap request
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to propose a swap');
  }
  if (!(await isVerifiedMember(user.id))) {
    return badRequest('FORBIDDEN', 'Verification is required before proposing a direct swap');
  }

  try {
    const json = await req.json();
    const result = createSwapRequestSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid swap proposal data', result.error.format());
    }

    const data = result.data;
    const supabase = getAdminClient();

    // 1. Verify requester owns the requester_property
    const { data: requesterProp } = await supabase
      .from('properties')
      .select('id, owner_id, listing_status')
      .eq('id', data.requester_property_id)
      .maybeSingle();

    if (!requesterProp) {
      return notFound('Requester property not found');
    }
    if (requesterProp.owner_id !== user.id) {
      return badRequest('VALIDATION_ERROR', 'You can only propose swaps using your own property');
    }
    if (requesterProp.listing_status !== 'active') {
      return badRequest('VALIDATION_ERROR', 'Your property must be active to propose swaps');
    }

    // 2. Verify recipient property exists and get owner
    const { data: recipientProp } = await supabase
      .from('properties')
      .select('id, owner_id, listing_status')
      .eq('id', data.recipient_property_id)
      .maybeSingle();

    if (!recipientProp) {
      return notFound('Recipient property not found');
    }
    if (recipientProp.owner_id === user.id) {
      return badRequest('SELF_BOOKING_NOT_ALLOWED', 'Cannot swap with your own property');
    }
    if (recipientProp.listing_status !== 'active') {
      return badRequest('VALIDATION_ERROR', 'Target property is not currently active');
    }

    const requesterNights = calculateNights(data.requester_check_in, data.requester_check_out);
    const recipientNights = calculateNights(data.recipient_check_in, data.recipient_check_out);
    const creditDifference = Math.abs(requesterNights - recipientNights);
    const creditPayerId = requesterNights > recipientNights ? user.id : recipientProp.owner_id;
    const creditRecipientId = requesterNights > recipientNights ? recipientProp.owner_id : user.id;
    const creditTermsStatus = creditDifference > 0 ? 'pending' : 'equal';

    if (creditDifference > 0) {
      const { data: payerAccount } = await supabase
        .from('credit_accounts')
        .select('available_balance')
        .eq('user_id', creditPayerId)
        .single();
      if (!payerAccount || payerAccount.available_balance < creditDifference) {
        return badRequest(
          'INSUFFICIENT_CREDITS',
          `Unequal swaps require ${creditDifference} available credit${creditDifference === 1 ? '' : 's'} from the longer-stay member. Start with an equal-night swap or earn credits by hosting first.`,
          { required: creditDifference, available: payerAccount?.available_balance ?? 0 },
        );
      }
    }

    // 3. Create swap request with requester accepted at creation
    const now = new Date().toISOString();
    const { data: swapRequest, error: insertError } = await supabase
      .from('swap_requests')
      .insert({
        requester_id: user.id,
        recipient_id: recipientProp.owner_id,
        requester_property_id: data.requester_property_id,
        recipient_property_id: data.recipient_property_id,
        requester_check_in: data.requester_check_in,
        requester_check_out: data.requester_check_out,
        recipient_check_in: data.recipient_check_in,
        recipient_check_out: data.recipient_check_out,
        request_status: 'pending',
        requester_accepted_at: now,
        credit_difference: creditDifference,
        credit_payer_id: creditDifference > 0 ? creditPayerId : null,
        credit_recipient_id: creditDifference > 0 ? creditRecipientId : null,
        credit_terms_status: creditTermsStatus,
      })
      .select()
      .single();

    if (insertError || !swapRequest) {
      return internalError('Failed to create swap proposal', insertError?.message);
    }

    return ok(swapRequest, undefined, 201);
  } catch (err: any) {
    return internalError('Server error creating swap request', err?.message);
  }
}

// GET /api/swaps - List swaps where user is requester or recipient
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to view swaps');
  }

  const supabase = getAdminClient();
  const { data: swaps, error } = await supabase
    .from('swap_requests')
    .select(`
      *,
      requester_property:properties!requester_property_id (id, title, city, neighbourhood),
      recipient_property:properties!recipient_property_id (id, title, city, neighbourhood),
      requester:profiles!requester_id (id, display_name, verification_status),
      recipient:profiles!recipient_id (id, display_name, verification_status),
      swap_agreements (*)
    `)
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    return internalError('Failed to retrieve swap requests', error.message);
  }

  return ok(swaps || []);
}
