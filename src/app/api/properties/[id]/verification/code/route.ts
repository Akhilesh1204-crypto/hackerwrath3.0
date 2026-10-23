import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { badRequest, forbidden, internalError, notFound, ok, unauthorized } from '@/lib/api-response';

// POST /api/properties/:id/verification/code - Issue or rotate the physical verification code
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to request a verification code');

  const supabase = getAdminClient();
  const { data: property } = await supabase
    .from('properties')
    .select('id, owner_id, verification_status, verification_code')
    .eq('id', params.id)
    .maybeSingle();

  if (!property) return notFound('Property not found');
  if (property.owner_id !== user.id) return forbidden('Only the property owner can request a verification code');
  if (property.verification_status === 'verified') {
    return badRequest('INVALID_STATE_TRANSITION', 'This property is already verified');
  }

  const { data: pending } = await supabase
    .from('property_verification_submissions')
    .select('id')
    .eq('property_id', params.id)
    .eq('status', 'pending')
    .maybeSingle();
  if (pending) {
    return badRequest(
      'INVALID_STATE_TRANSITION',
      'A verification submission is already under review. Wait for the decision before rotating the code.',
    );
  }

  const code = randomBytes(3).toString('hex').toUpperCase();
  const { error } = await supabase
    .from('properties')
    .update({ verification_code: code, updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) return internalError('Failed to generate verification code', error.message);

  return ok({
    verification_code: code,
    instructions:
      'Write this code on a card, place it inside the home, and upload a clear photo showing the card in the room.',
  });
}
