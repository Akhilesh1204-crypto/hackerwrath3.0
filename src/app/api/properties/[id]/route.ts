import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { updatePropertySchema } from '@/lib/validations/property';
import { ok, unauthorized, forbidden, notFound, badRequest, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

// GET /api/properties/:id - Property details
export async function GET(req: NextRequest, { params }: RouteContext) {
  const propertyId = params.id;
  const user = await getAuthUser(req);
  const supabase = getAdminClient();

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_scores (*),
      property_photos (*),
      owner:profiles (
        id,
        display_name,
        verification_status
      )
    `)
    .eq('id', propertyId)
    .maybeSingle();

  if (error || !property) {
    return notFound('Property listing not found');
  }

  // Check if caller is authorized to view exact address:
  // Must be the owner, or a guest with a confirmed booking
  let canViewExactAddress = false;
  if (user) {
    if (user.id === property.owner_id || user.role === 'admin') {
      canViewExactAddress = true;
    } else {
      const { data: confirmedBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId)
        .eq('guest_id', user.id)
        .eq('booking_status', 'confirmed')
        .maybeSingle();

      if (confirmedBooking) {
        canViewExactAddress = true;
      }
    }
  }

  // Obfuscate exact address if not authorized
  const sanitizedProperty = {
    ...property,
    exact_address: canViewExactAddress ? property.exact_address : undefined,
  };

  return ok(sanitizedProperty);
}

// PATCH /api/properties/:id - Update authorized listing
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const propertyId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to modify listing');
  }

  const supabase = getAdminClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', propertyId)
    .maybeSingle();

  if (fetchError || !existing) {
    return notFound('Property listing not found');
  }

  if (existing.owner_id !== user.id && user.role !== 'admin') {
    return forbidden('You do not own this property listing');
  }

  try {
    const json = await req.json();
    const result = updatePropertySchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid update data', result.error.format());
    }

    const { data: updated, error: updateError } = await supabase
      .from('properties')
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select()
      .single();

    if (updateError) {
      return internalError('Failed to update listing', updateError.message);
    }

    return ok(updated);
  } catch (err: any) {
    return internalError('Server error updating listing', err?.message);
  }
}
