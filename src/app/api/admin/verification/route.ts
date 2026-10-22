import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { forbidden, internalError, ok, unauthorized } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const admin = await getAuthUser(req);
  if (!admin) return unauthorized('Authentication required');
  if (admin.role !== 'admin') return forbidden('Admin privilege required');

  const supabase = getAdminClient();
  const { data: submissions, error } = await supabase
    .from('verification_submissions')
    .select('id, user_id, id_document_path, property_proof_path, status, notes, created_at, profiles!inner(id, display_name, verification_status)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) return internalError('Failed to retrieve verification queue', error.message);
  return ok(submissions ?? []);
}
