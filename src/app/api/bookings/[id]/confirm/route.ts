import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, forbidden, notFound, badRequest, conflict, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

// POST /api/bookings/:id/confirm - Host confirms booking request
export async function POST(req: NextRequest, { params }: RouteContext) {
  const bookingId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to confirm booking');
  }

  const supabase = getAdminClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !booking) {
    return notFound('Booking request not found');
  }

  // Only the host can confirm the booking
  if (booking.host_id !== user.id && user.role !== 'admin') {
    return forbidden('Only the host of this property can confirm the booking');
  }

  if (booking.booking_status !== 'requested') {
    return badRequest('INVALID_STATE_TRANSITION', `Cannot confirm a booking with status: ${booking.booking_status}`);
  }

  // Re-verify no newly created confirmed bookings conflict with this date range
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('property_id', booking.property_id)
    .eq('booking_status', 'confirmed')
    .lt('check_in', booking.check_out)
    .gt('check_out', booking.check_in);

  if (conflicts && conflicts.length > 0) {
    return conflict('OVERLAPPING_BOOKING', 'Property already has an active confirmed booking for these dates');
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      booking_status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) {
    return internalError('Failed to confirm booking', updateError.message);
  }

  return ok(updated);
}
