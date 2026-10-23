import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { forbidden, internalError, notFound, ok, unauthorized } from '@/lib/api-response';
import { PROPERTY_VIDEO_BUCKET } from '@/lib/services/storage';

// DELETE /api/properties/:id/media/:mediaId - Remove a listing video
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; mediaId: string } },
) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to remove property media');

  const supabase = getAdminClient();
  const { data: media, error } = await supabase
    .from('property_media')
    .select('id, owner_id, media_type, storage_path')
    .eq('id', params.mediaId)
    .eq('property_id', params.id)
    .maybeSingle();
  if (error) return internalError('Failed to load property media', error.message);
  if (!media) return notFound('Property media not found');
  if (media.owner_id !== user.id && user.role !== 'admin') {
    return forbidden('You do not own this listing');
  }

  const { error: deleteError } = await supabase.from('property_media').delete().eq('id', media.id);
  if (deleteError) return internalError('Failed to remove property media', deleteError.message);

  if (media.media_type === 'video') {
    // Best effort: remove the stored object as well.
    await supabase.storage.from(PROPERTY_VIDEO_BUCKET).remove([media.storage_path]);
  }

  return ok({ id: media.id, deleted: true });
}
