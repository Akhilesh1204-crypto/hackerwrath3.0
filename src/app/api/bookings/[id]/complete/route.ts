import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { LedgerService } from '@/lib/services/ledger';
import { ok, unauthorized, forbidden, notFound, badRequest, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

// POST /api/bookings/:id/complete - Mark stay as completed and settle credits
export async function POST(req: NextRequest, { params }: RouteContext) {
  const bookingId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to complete booking');
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

  // Host or admin can confirm checkout completion
  if (booking.host_id !== user.id && user.role !== 'admin') {
    return forbidden('Only the host can mark the stay as completed');
  }

  if (booking.booking_status !== 'confirmed') {
    return badRequest('INVALID_STATE_TRANSITION', `Cannot complete a booking with status: ${booking.booking_status}`);
  }

  // 1. Settle credits if it's a credit stay
  if (booking.booking_type === 'credit_stay' && booking.credit_price > 0) {
    try {
      await LedgerService.settleStay({
        guestId: booking.guest_id,
        hostId: booking.host_id,
        bookingId: booking.id,
        amount: booking.credit_price,
      });
    } catch (settleError: any) {
      return internalError('Failed to settle credit ledger for stay', settleError.message);
    }
  }

  // 2. Update booking status to completed
  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      booking_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) {
    return internalError('Failed to update booking status', updateError.message);
  }

  return ok({
    booking: updated,
    settled: booking.booking_type === 'credit_stay',
    creditsTransferred: booking.credit_price,
  });
}
