import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { createReportSchema } from '@/lib/validations/report';
import { ok, unauthorized, badRequest, internalError } from '@/lib/api-response';

// POST /api/reports - Report property, booking, or safety issue
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to submit report');
  }

  try {
    const json = await req.json();
    const result = createReportSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid report submission data', result.error.format());
    }

    const data = result.data;
    const supabase = getAdminClient();

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: data.target_type,
        target_id: data.target_id,
        category: data.category,
        description: data.description,
        evidence_urls: data.evidence_urls,
        status: 'open',
      })
      .select()
      .single();

    if (error || !report) {
      return internalError('Failed to record report', error?.message);
    }

    return ok(report, undefined, 201);
  } catch (err: any) {
    return internalError('Server error filing report', err?.message);
  }
}

// GET /api/reports - Caller's filed reports
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return unauthorized('Authentication required to view reports');
  }

  const supabase = getAdminClient();
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return internalError('Failed to fetch reports', error.message);
  }

  return ok(reports || []);
}
