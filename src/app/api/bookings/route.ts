import { NextRequest } from 'next/server';
import { getAuthUser, isVerifiedMember } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { createBookingRequestSchema } from '@/lib/validations/booking';
import { calculateNights } from '@/lib/services/dates';
import { LedgerService, CREDIT_PER_NIGHT_DEFAULT } from '@/lib/services/ledger';
import { ok, unauthorized, badRequest, notFound, conflict, internalError } from '@/lib/api-response';

// POST /api/bookings - Create credit booking request
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to request a booking');
  }
  if (!(await isVerifiedMember(user.id))) {
    return badRequest('FORBIDDEN', 'Verification is required before requesting a credit stay');
  }

  try {
    const json = await req.json();
    const result = createBookingRequestSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid booking request parameters', result.error.format());
    }

    const { property_id, check_in, check_out, idempotency_key } = result.data;
    const supabase = getAdminClient();

    // 1. Fetch property details and owner
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, owner_id, listing_status, title')
      .eq('id', property_id)
      .maybeSingle();

    if (propError || !property) {
      return notFound('Property listing not found');
    }

    if (property.owner_id === user.id) {
      return badRequest('SELF_BOOKING_NOT_ALLOWED', 'Hosts cannot book their own property');
    }

    if (property.listing_status !== 'active') {
      return badRequest('VALIDATION_ERROR', 'Property is not active for booking');
    }

    // 2. Calculate nights and credit cost
    const nights = calculateNights(check_in, check_out);
    if (nights <= 0) {
      return badRequest('VALIDATION_ERROR', 'Stay must be at least 1 night');
    }
    const creditCost = nights * CREDIT_PER_NIGHT_DEFAULT;

    // 3. Verify no overlapping confirmed bookings
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('property_id', property_id)
      .eq('booking_status', 'confirmed')
      .lt('check_in', check_out)
      .gt('check_out', check_in);

    if (conflicts && conflicts.length > 0) {
      return conflict('OVERLAPPING_BOOKING', 'These dates conflict with an existing confirmed booking');
    }

    // 4. Verify guest has enough available credits before creating record
    const { data: account } = await supabase
      .from('credit_accounts')
      .select('available_balance')
      .eq('user_id', user.id)
      .single();

    if (!account || account.available_balance < creditCost) {
      return badRequest(
        'INSUFFICIENT_CREDITS',
        `Insufficient credit balance. This ${nights}-night stay requires ${creditCost} credits, but you have ${account?.available_balance ?? 0} credits available.`,
        { required: creditCost, available: account?.available_balance ?? 0 }
      );
    }

    // 5. Create booking record with status 'requested'
    const { data: booking, error: bookError } = await supabase
      .from('bookings')
      .insert({
        property_id,
        guest_id: user.id,
        host_id: property.owner_id,
        check_in,
        check_out,
        booking_status: 'requested',
        booking_type: 'credit_stay',
        credit_price: creditCost,
        credit_reservation_amount: creditCost,
      })
      .select()
      .single();

    if (bookError || !booking) {
      return internalError('Failed to create booking request', bookError?.message);
    }

    // 6. Reserve credits atomically in ledger
    const reserveResult = await LedgerService.reserveCredits({
      userId: user.id,
      bookingId: booking.id,
      amount: creditCost,
      idempotencyKey: idempotency_key,
      description: `Hold ${creditCost} credits for stay at ${property.title} (${nights} nights)`,
    });

    if (!reserveResult.success) {
      // Compensate: Delete the requested booking if hold fails
      await supabase.from('bookings').delete().eq('id', booking.id);
      return badRequest('INSUFFICIENT_CREDITS', 'Failed to reserve required credits', reserveResult);
    }

    return ok({
      booking,
      creditCost,
      balances: reserveResult.balances,
    }, undefined, 201);
  } catch (err: any) {
    return internalError('Server error creating booking request', err?.message);
  }
}

// GET /api/bookings - List member's bookings
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to view bookings');
  }

  const supabase = getAdminClient();
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      property:properties (id, title, city, neighbourhood, property_type),
      guest:profiles!guest_id (id, display_name, verification_status),
      host:profiles!host_id (id, display_name, verification_status)
    `)
    .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    return internalError('Failed to retrieve bookings', error.message);
  }

  return ok(bookings || []);
}
