import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { badRequest, forbidden, internalError, notFound, ok, unauthorized } from '@/lib/api-response';
import { propertyVerificationDecisionSchema } from '@/lib/validations/property-verification';

// POST /api/admin/property-verification/:id - Approve or reject property evidence
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAuthUser(req);
  if (!admin) return unauthorized('Authentication required');
  if (admin.role !== 'admin') return forbidden('Admin privilege required');

  try {
    const parsed = propertyVerificationDecisionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid decision data', parsed.error.format());
    }
    const { decision, notes } = parsed.data;
    if (decision === 'rejected' && (!notes || notes.length < 10)) {
      return badRequest('VALIDATION_ERROR', 'Add at least 10 characters of notes when rejecting');
    }

    const supabase = getAdminClient();
    const { data: submission, error: fetchError } = await supabase
      .from('property_verification_submissions')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) return internalError('Failed to load verification submission', fetchError.message);
    if (!submission) return notFound('Verification submission not found');
    if (submission.status !== 'pending') {
      return badRequest('INVALID_STATE_TRANSITION', 'This submission has already been reviewed');
    }

    const now = new Date().toISOString();
    const { error: submissionError } = await supabase
      .from('property_verification_submissions')
      .update({
        status: decision,
        notes: notes ?? null,
        reviewed_by: admin.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('id', params.id);
    if (submissionError) return internalError('Failed to record verification decision', submissionError.message);

    const { error: propertyError } = await supabase
      .from('properties')
      .update({
        verification_status: decision,
        verification_notes: notes ?? null,
        verified_at: decision === 'verified' ? now : null,
        ...(decision === 'verified' ? { listing_status: 'active' } : {}),
        updated_at: now,
      })
      .eq('id', submission.property_id);
    if (propertyError) return internalError('Failed to update property verification state', propertyError.message);

    // Once the property is verified its approved media can be published.
    if (decision === 'verified') {
      await supabase
        .from('property_media')
        .update({ moderation_status: 'approved' })
        .eq('property_id', submission.property_id)
        .eq('moderation_status', 'pending');
    }

    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      action: `PROPERTY_VERIFICATION_${decision.toUpperCase()}`,
      entity_type: 'property',
      entity_id: submission.property_id,
      details: { submission_id: submission.id, notes: notes ?? null },
    });

    return ok({
      submission_id: submission.id,
      property_id: submission.property_id,
      verification_status: decision,
      notes: notes ?? null,
    });
  } catch (error: any) {
    return internalError('Server error deciding property verification', error?.message);
  }
}
