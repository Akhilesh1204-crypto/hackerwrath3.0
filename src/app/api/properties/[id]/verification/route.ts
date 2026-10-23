import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { badRequest, forbidden, internalError, notFound, ok, unauthorized } from '@/lib/api-response';
import {
  PROPERTY_EVIDENCE_BUCKET,
  createSignedStorageUrl,
} from '@/lib/services/storage';
import { propertyVerificationSchema } from '@/lib/validations/property-verification';

async function loadOwnedProperty(propertyId: string, userId: string, role: string) {
  const supabase = getAdminClient();
  const { data: property } = await supabase
    .from('properties')
    .select('id, owner_id, verification_status, verification_code, verification_notes, verified_at')
    .eq('id', propertyId)
    .maybeSingle();
  if (!property) return { error: notFound('Property not found') } as const;
  if (property.owner_id !== userId && role !== 'admin') {
    return { error: forbidden('Only the property owner can manage verification') } as const;
  }
  return { property, supabase } as const;
}

async function withEvidenceUrls(submission: Record<string, any> | null) {
  if (!submission) return null;
  const [ownership, lease, codePhoto] = await Promise.all([
    createSignedStorageUrl(PROPERTY_EVIDENCE_BUCKET, submission.ownership_document_path),
    createSignedStorageUrl(PROPERTY_EVIDENCE_BUCKET, submission.lease_document_path),
    createSignedStorageUrl(PROPERTY_EVIDENCE_BUCKET, submission.physical_code_photo_path),
  ]);
  return {
    ...submission,
    ownership_document_url: ownership,
    lease_document_url: lease,
    physical_code_photo_url: codePhoto,
  };
}

// GET /api/properties/:id/verification - Owner/admin view of the latest submission
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to view property verification');

  const owned = await loadOwnedProperty(params.id, user.id, user.role);
  if ('error' in owned) return owned.error;

  const { data: submission, error } = await owned.supabase
    .from('property_verification_submissions')
    .select('*')
    .eq('property_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return internalError('Failed to retrieve property verification', error.message);

  return ok({
    property: {
      id: owned.property.id,
      verification_status: owned.property.verification_status,
      verification_code: owned.property.verification_code,
      verification_notes: owned.property.verification_notes,
      verified_at: owned.property.verified_at,
    },
    submission: await withEvidenceUrls(submission),
  });
}

// POST /api/properties/:id/verification - Submit ownership evidence and code photo
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to submit property verification');

  try {
    const parsed = propertyVerificationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid property verification data', parsed.error.format());
    }

    const owned = await loadOwnedProperty(params.id, user.id, user.role);
    if ('error' in owned) return owned.error;
    if (owned.property.owner_id !== user.id) {
      return forbidden('Only the property owner can submit verification');
    }

    const { data: pending } = await owned.supabase
      .from('property_verification_submissions')
      .select('id')
      .eq('property_id', params.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (pending) {
      return badRequest('INVALID_STATE_TRANSITION', 'This property is already under verification review');
    }

    const physicalCode =
      owned.property.verification_code ?? randomBytes(3).toString('hex').toUpperCase();

    const { data: submission, error } = await owned.supabase
      .from('property_verification_submissions')
      .insert({
        property_id: params.id,
        owner_id: user.id,
        ownership_document_path: parsed.data.ownership_document_path ?? null,
        lease_document_path: parsed.data.lease_document_path ?? null,
        physical_code: physicalCode,
        physical_code_photo_path: parsed.data.physical_code_photo_path,
        status: 'pending',
      })
      .select()
      .single();
    if (error || !submission) return internalError('Failed to submit property verification', error?.message);

    await owned.supabase
      .from('properties')
      .update({
        verification_status: 'pending',
        verification_code: physicalCode,
        verification_notes: null,
        verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    await owned.supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'PROPERTY_VERIFICATION_SUBMITTED',
      entity_type: 'property',
      entity_id: params.id,
      details: { submission_id: submission.id },
    });

    return ok(await withEvidenceUrls(submission), undefined, 201);
  } catch (error: any) {
    return internalError('Server error submitting property verification', error?.message);
  }
}
