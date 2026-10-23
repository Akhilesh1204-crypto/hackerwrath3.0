import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { forbidden, internalError, ok, unauthorized } from '@/lib/api-response';
import { PROPERTY_EVIDENCE_BUCKET, createSignedStorageUrl } from '@/lib/services/storage';

// GET /api/admin/property-verification - Review queue of property evidence
export async function GET(req: NextRequest) {
  const admin = await getAuthUser(req);
  if (!admin) return unauthorized('Authentication required');
  if (admin.role !== 'admin') return forbidden('Admin privilege required');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('property_verification_submissions')
    .select(
      '*, property:properties(id, title, city, neighbourhood, owner_id, listing_status, verification_status), owner:profiles!owner_id(id, display_name, verification_status)',
    )
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) return internalError('Failed to retrieve property verification queue', error.message);

  const items = await Promise.all(
    (data ?? []).map(async (submission: Record<string, any>) => {
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
    }),
  );

  return ok(items);
}
