import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, forbidden, notFound, badRequest, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { userId: string };
}

const adminVerificationDecisionSchema = z.object({
  decision: z.enum(['verified', 'rejected']),
  notes: z.string().optional(),
});

// POST /api/admin/verification/:userId - Admin approves or rejects member verification
export async function POST(req: NextRequest, { params }: RouteContext) {
  const targetUserId = params.userId;
  const admin = await getAuthUser(req);

  if (!admin) {
    return unauthorized('Authentication required');
  }

  if (admin.role !== 'admin') {
    return forbidden('Admin privilege required');
  }

  try {
    const json = await req.json();
    const result = adminVerificationDecisionSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid decision data', result.error.format());
    }

    const { decision, notes } = result.data;
    const supabase = getAdminClient();

    // 1. Update target user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        verification_status: decision,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      return notFound('Target user profile not found');
    }

    // 2. Audit log entry
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      action: `VERIFICATION_${decision.toUpperCase()}`,
      entity_type: 'profile',
      entity_id: targetUserId,
      details: { notes, decided_by: admin.id },
    });

    return ok({
      user_id: targetUserId,
      verification_status: updatedProfile.verification_status,
      notes,
    });
  } catch (err: any) {
    return internalError('Server error deciding verification', err?.message);
  }
}
