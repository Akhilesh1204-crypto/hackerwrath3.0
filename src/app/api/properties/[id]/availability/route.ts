import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { updateAvailabilitySchema, getAvailabilityQuerySchema } from '@/lib/validations/availability';
import { ok, unauthorized, forbidden, notFound, badRequest, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

// GET /api/properties/:id/availability - Fetch property calendar availability
export async function GET(req: NextRequest, { params }: RouteContext) {
  const propertyId = params.id;
  const { searchParams } = new URL(req.url);

  const query = {
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  };

  const parsed = getAvailabilityQuerySchema.safeParse(query);
  if (!parsed.success) {
    return badRequest('VALIDATION_ERROR', 'startDate and endDate in YYYY-MM-DD required', parsed.error.format());
  }

  const supabase = getAdminClient();
  const { data: records, error } = await supabase
    .from('availability')
    .select('date, availability_status')
    .eq('property_id', propertyId)
    .gte('date', parsed.data.startDate)
    .lte('date', parsed.data.endDate)
    .order('date', { ascending: true });

  if (error) {
    return internalError('Failed to fetch availability', error.message);
  }

  return ok(records || []);
}

// POST /api/properties/:id/availability - Update host availability
export async function POST(req: NextRequest, { params }: RouteContext) {
  const propertyId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to manage availability');
  }

  const supabase = getAdminClient();

  // Verify ownership
  const { data: property, error: fetchError } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', propertyId)
    .maybeSingle();

  if (fetchError || !property) {
    return notFound('Property listing not found');
  }

  if (property.owner_id !== user.id && user.role !== 'admin') {
    return forbidden('You do not have permission to manage this property calendar');
  }

  try {
    const json = await req.json();
    const parsed = updateAvailabilitySchema.safeParse(json);

    if (!parsed.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid dates format', parsed.error.format());
    }

    const rows = parsed.data.dates.map((d) => ({
      property_id: propertyId,
      date: d.date,
      availability_status: d.status,
      updated_at: new Date().toISOString(),
    }));

    // Upsert on conflict (property_id, date)
    const { data: upserted, error: upsertError } = await supabase
      .from('availability')
      .upsert(rows, { onConflict: 'property_id, date' })
      .select();

    if (upsertError) {
      return internalError('Failed to update availability calendar', upsertError.message);
    }

    return ok(upserted);
  } catch (err: any) {
    return internalError('Server error updating availability', err?.message);
  }
}
