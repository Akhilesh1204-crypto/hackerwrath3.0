import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { cancelBookingSchema } from '@/lib/validations/booking';
import { LedgerService } from '@/lib/services/ledger';
import { ok, unauthorized, forbidden, notFound, badRequest, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

// POST /api/bookings/:id/cancel - Cancel booking under policy
export async function POST(req: NextRequest, { params }: RouteContext) {
  const bookingId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to cancel a booking');
  }

  const supabase = getAdminClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !booking) {
    return notFound('Booking not found');
  }

  // Must be guest, host, or admin
  if (booking.guest_id !== user.id && booking.host_id !== user.id && user.role !== 'admin') {
    return forbidden('You are not authorized to cancel this booking');
  }

  if (booking.booking_status === 'cancelled' || booking.booking_status === 'completed') {
    return badRequest('INVALID_STATE_TRANSITION', `Cannot cancel booking with status: ${booking.booking_status}`);
  }

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = cancelBookingSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest('VALIDATION_ERROR', 'A cancellation reason of at least 5 characters is required', parsed.error.format());
    }
    const cancelReason = parsed.data.reason;

    // If credit stay, release the held credits back to the guest
    let cancellationFeeNights = 0;
    if (booking.booking_type === 'credit_stay' && booking.credit_price > 0) {
      const reservationAmount = booking.credit_reservation_amount || booking.credit_price;
      const daysUntilCheckIn = Math.floor(
        (new Date(`${booking.check_in}T00:00:00Z`).getTime() - Date.now()) / 86_400_000,
      );
      cancellationFeeNights = daysUntilCheckIn >= 7 ? 0 : Math.min(1, reservationAmount);
      await LedgerService.settleCancellationFee({
        guestId: booking.guest_id,
        hostId: booking.host_id,
        bookingId: booking.id,
        reservedAmount: reservationAmount,
        feeNights: cancellationFeeNights,
      });
    }

    // Update booking status to cancelled
    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        cancellation_fee_nights: cancellationFeeNights,
        credits_released_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return internalError('Failed to cancel booking', updateError.message);
    }

    return ok(updated);
  } catch (err: any) {
    return internalError('Server error processing cancellation', err?.message);
  }
}
