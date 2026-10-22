import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { addPhotoSchema } from '@/lib/validations/photo';
import { ok, unauthorized, forbidden, notFound, badRequest, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string };
}

// POST /api/properties/:id/photos - Add photo to property listing
export async function POST(req: NextRequest, { params }: RouteContext) {
  const propertyId = params.id;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required to upload photos');
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
    return forbidden('You do not own this listing');
  }

  try {
    const json = await req.json();
    const result = addPhotoSchema.safeParse(json);

    if (!result.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid photo metadata', result.error.format());
    }

    const { data: photo, error: insertError } = await supabase
      .from('property_photos')
      .insert({
        property_id: propertyId,
        storage_path: result.data.storage_path,
        display_order: result.data.display_order,
        moderation_status: 'approved',
      })
      .select()
      .single();

    if (insertError || !photo) {
      return internalError('Failed to add photo', insertError?.message);
    }

    return ok(photo, undefined, 201);
  } catch (err: any) {
    return internalError('Server error adding photo', err?.message);
  }
}

// GET /api/properties/:id/photos - Fetch all photos for property
export async function GET(req: NextRequest, { params }: RouteContext) {
  const propertyId = params.id;
  const supabase = getAdminClient();

  const { data: photos, error } = await supabase
    .from('property_photos')
    .select('*')
    .eq('property_id', propertyId)
    .order('display_order', { ascending: true });

  if (error) {
    return internalError('Failed to fetch property photos', error.message);
  }

  return ok(photos || []);
}
