import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { ok, unauthorized, forbidden, notFound, internalError } from '@/lib/api-response';

interface RouteContext {
  params: { id: string; photoId: string };
}

// DELETE /api/properties/:id/photos/:photoId - Delete a photo from property
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: propertyId, photoId } = params;
  const user = await getAuthUser(req);

  if (!user) {
    return unauthorized('Authentication required');
  }

  const supabase = getAdminClient();

  // Verify ownership
  const { data: property } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', propertyId)
    .maybeSingle();

  if (!property) {
    return notFound('Property not found');
  }

  if (property.owner_id !== user.id && user.role !== 'admin') {
    return forbidden('You do not own this property listing');
  }

  const { error } = await supabase
    .from('property_photos')
    .delete()
    .eq('id', photoId)
    .eq('property_id', propertyId);

  if (error) {
    return internalError('Failed to delete photo', error.message);
  }

  return ok({ deleted: true, photoId });
}
