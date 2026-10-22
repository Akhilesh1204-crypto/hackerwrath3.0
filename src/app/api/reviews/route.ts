import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { createReviewSchema } from '@/lib/validations/review';
import { ok, unauthorized, badRequest, notFound, forbidden, conflict, internalError } from '@/lib/api-response';

// POST /api/reviews - Submit eligible review
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to submit review');
  }

  try {
    const json = await req.json();
    const result = createReviewSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid review submission data', result.error.format());
    }

    const { booking_id, rating, comment } = result.data;
    const supabase = getAdminClient();

    // 1. Fetch booking to verify stay was completed and caller is participant
    const { data: booking, error: bookError } = await supabase
      .from('bookings')
      .select('id, guest_id, host_id, booking_status')
      .eq('id', booking_id)
      .maybeSingle();

    if (bookError || !booking) {
      return notFound('Booking not found');
    }

    if (booking.guest_id !== user.id && booking.host_id !== user.id) {
      return forbidden('Only guests or hosts of this stay can leave a review');
    }

    // Invariant: Reviews only for completed stays
    if (booking.booking_status !== 'completed') {
      return badRequest('INVALID_STATE_TRANSITION', 'Reviews can only be submitted for completed stays');
    }

    // Determine who is being reviewed
    const reviewedUserId = user.id === booking.guest_id ? booking.host_id : booking.guest_id;

    // Check if review already submitted by this party
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('reviewer_id', user.id)
      .maybeSingle();

    if (existing) {
      return conflict('CONFLICT', 'You have already submitted a review for this stay');
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        reviewer_id: user.id,
        reviewed_user_id: reviewedUserId,
        rating,
        comment,
        moderation_status: 'approved',
      })
      .select()
      .single();

    if (insertError || !review) {
      return internalError('Failed to save review', insertError?.message);
    }

    return ok(review, undefined, 201);
  } catch (err: any) {
    return internalError('Server error creating review', err?.message);
  }
}
