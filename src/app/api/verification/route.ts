import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, badRequest, conflict, internalError } from '@/lib/api-response';

const submitVerificationSchema = z.object({
  id_document_path: z.string().min(5, 'Valid ID document storage path required'),
  property_proof_path: z.string().min(5, 'Valid property authority storage path required').optional(),
});

// POST /api/verification - Member submits identity & property authority evidence
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to submit verification');
  }

  try {
    const json = await req.json();
    const result = submitVerificationSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid verification payload', result.error.format());
    }

    const supabase = getAdminClient();

    const { data: existingPending } = await supabase
      .from('verification_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (existingPending) return conflict('INVALID_STATE_TRANSITION', 'Your verification submission is already under review');

    const { error: submissionError } = await supabase.from('verification_submissions').insert({
      user_id: user.id,
      id_document_path: result.data.id_document_path,
      property_proof_path: result.data.property_proof_path ?? null,
      status: 'pending',
    });
    if (submissionError) return internalError('Failed to store verification submission', submissionError.message);

    // Update profile verification status to 'pending'
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        verification_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return internalError('Failed to update verification status', error.message);
    }

    return ok({
      message: 'Verification documents submitted for review',
      verification_status: profile.verification_status,
    });
  } catch (err: any) {
    return internalError('Server error submitting verification', err?.message);
  }
}
