import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { badRequest, forbidden, internalError, notFound, ok, unauthorized } from '@/lib/api-response';
import {
  PROPERTY_PHOTO_BUCKET,
  PROPERTY_VIDEO_BUCKET,
  createSignedStorageUrl,
} from '@/lib/services/storage';
import { propertyMediaSchema } from '@/lib/validations/property-verification';

async function withMediaUrl(media: Record<string, any>) {
  const bucket = media.media_type === 'video' ? PROPERTY_VIDEO_BUCKET : PROPERTY_PHOTO_BUCKET;
  const url = await createSignedStorageUrl(bucket, media.storage_path, 60 * 60);
  return { ...media, url };
}

// GET /api/properties/:id/media - Owner/admin media list with playback URLs
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to view property media');
  const supabase = getAdminClient();
  const { data: property } = await supabase.from('properties').select('owner_id').eq('id', params.id).maybeSingle();
  if (!property) return notFound('Property not found');
  if (property.owner_id !== user.id && user.role !== 'admin') {
    return forbidden('Only the property owner can view private media');
  }
  const { data: media, error } = await supabase
    .from('property_media')
    .select('*')
    .eq('property_id', params.id)
    .order('display_order', { ascending: true });
  if (error) return internalError('Failed to retrieve property media', error.message);

  const items = await Promise.all((media ?? []).map((item: Record<string, any>) => withMediaUrl(item)));
  return ok(items);
}

// POST /api/properties/:id/media - Register an uploaded photo or short video
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to add property media');
  try {
    const parsed = propertyMediaSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest('VALIDATION_ERROR', 'Invalid property media data', parsed.error.format());
    const supabase = getAdminClient();
    const { data: property } = await supabase
      .from('properties')
      .select('owner_id, verification_status')
      .eq('id', params.id)
      .maybeSingle();
    if (!property) return notFound('Property not found');
    if (property.owner_id !== user.id) return forbidden('Only the property owner can add media');

    const { data: media, error } = await supabase
      .from('property_media')
      .insert({
        property_id: params.id,
        owner_id: user.id,
        media_type: parsed.data.media_type,
        storage_path: parsed.data.storage_path,
        display_order: parsed.data.display_order ?? 0,
        duration_seconds: parsed.data.duration_seconds ?? null,
        moderation_status: 'approved',
      })
      .select()
      .single();
    if (error || !media) return internalError('Failed to add property media', error?.message);
    return ok(await withMediaUrl(media), undefined, 201);
  } catch (error: any) {
    return internalError('Server error adding property media', error?.message);
  }
}
