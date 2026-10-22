import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, forbidden, notFound, conflict, badRequest, internalError } from '@/lib/api-response';
import { getNightDates } from '@/lib/services/dates';

interface RouteContext {
  params: { id: string };
}

// POST /api/swaps/:id/accept - Recipient accepts swap proposal
export async function POST(req: NextRequest, { params }: RouteContext) {
  const swapId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to accept a swap');
  }

  const supabase = getAdminClient();

  // 1. Fetch swap request
  const { data: swap, error } = await supabase
    .from('swap_requests')
    .select(`
      *,
      requester_property:properties!requester_property_id (id, title, city, listing_status),
      recipient_property:properties!recipient_property_id (id, title, city, listing_status)
    `)
    .eq('id', swapId)
    .maybeSingle();

  if (error || !swap) {
    return notFound('Swap request not found');
  }

  // Only the designated recipient can accept
  if (swap.recipient_id !== user.id) {
    return forbidden('Only the recipient of this swap request can accept it');
  }

  if (swap.request_status !== 'pending' && swap.request_status !== 'requester_accepted') {
    return badRequest('INVALID_STATE_TRANSITION', `Cannot accept swap with status: ${swap.request_status}`);
  }

  const now = new Date().toISOString();

  // 2. Validate availability and no conflicting confirmed bookings for both legs
  // Leg 1: Requester staying at Recipient's property
  const { data: conflictLeg1 } = await supabase
    .from('bookings')
    .select('id')
    .eq('property_id', swap.recipient_property_id)
    .eq('booking_status', 'confirmed')
    .lt('check_in', swap.requester_check_out)
    .gt('check_out', swap.requester_check_in);

  if (conflictLeg1 && conflictLeg1.length > 0) {
    return conflict('OVERLAPPING_BOOKING', 'Recipient property already has a confirmed booking for these dates');
  }

  // Leg 2: Recipient staying at Requester's property
  const { data: conflictLeg2 } = await supabase
    .from('bookings')
    .select('id')
    .eq('property_id', swap.requester_property_id)
    .eq('booking_status', 'confirmed')
    .lt('check_in', swap.recipient_check_out)
    .gt('check_out', swap.recipient_check_in);

  if (conflictLeg2 && conflictLeg2.length > 0) {
    return conflict('OVERLAPPING_BOOKING', 'Requester property already has a confirmed booking for these dates');
  }

  // 3. Atomically confirm: create agreement snapshot and two bookings
  const termsSnapshot = {
    swap_request_id: swap.id,
    requester_id: swap.requester_id,
    recipient_id: swap.recipient_id,
    requester_stay: {
      property_id: swap.recipient_property_id,
      check_in: swap.requester_check_in,
      check_out: swap.requester_check_out,
    },
    recipient_stay: {
      property_id: swap.requester_property_id,
      check_in: swap.recipient_check_in,
      check_out: swap.recipient_check_out,
    },
    version: '1.0',
    confirmed_at: now,
  };

  // Insert agreement
  const { error: agError } = await supabase.from('swap_agreements').insert({
    swap_request_id: swap.id,
    agreement_version: '1.0',
    terms_snapshot: termsSnapshot,
    requester_accepted_at: swap.requester_accepted_at || now,
    recipient_accepted_at: now,
    confirmed_at: now,
  });

  if (agError) {
    return internalError('Failed to record swap agreement', agError.message);
  }

  // Insert Booking Leg 1 (Requester is guest at recipient property)
  const { data: bookingLeg1, error: b1Error } = await supabase
    .from('bookings')
    .insert({
      property_id: swap.recipient_property_id,
      guest_id: swap.requester_id,
      host_id: swap.recipient_id,
      check_in: swap.requester_check_in,
      check_out: swap.requester_check_out,
      booking_status: 'confirmed',
      booking_type: 'direct_swap',
      credit_price: 0,
      swap_request_id: swap.id,
    })
    .select()
    .single();

  if (b1Error) {
    return conflict('OVERLAPPING_BOOKING', 'Date conflict preventing confirmation of Leg 1', b1Error.message);
  }

  // Insert Booking Leg 2 (Recipient is guest at requester property)
  const { data: bookingLeg2, error: b2Error } = await supabase
    .from('bookings')
    .insert({
      property_id: swap.requester_property_id,
      guest_id: swap.recipient_id,
      host_id: swap.requester_id,
      check_in: swap.recipient_check_in,
      check_out: swap.recipient_check_out,
      booking_status: 'confirmed',
      booking_type: 'direct_swap',
      credit_price: 0,
      swap_request_id: swap.id,
    })
    .select()
    .single();

  if (b2Error) {
    // Compensate leg 1 if leg 2 fails
    await supabase.from('bookings').delete().eq('id', bookingLeg1.id);
    return conflict('OVERLAPPING_BOOKING', 'Date conflict preventing confirmation of Leg 2', b2Error.message);
  }

  // 4. Update swap request status
  const { data: updatedSwap } = await supabase
    .from('swap_requests')
    .update({
      request_status: 'confirmed',
      recipient_accepted_at: now,
      updated_at: now,
    })
    .eq('id', swap.id)
    .select()
    .single();

  return ok({
    swap: updatedSwap,
    bookings: [bookingLeg1, bookingLeg2],
    agreement: termsSnapshot,
  });
}
