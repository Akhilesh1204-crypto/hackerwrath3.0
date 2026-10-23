import { getAdminClient } from '@/lib/supabase/admin';

export const PROPERTY_EVIDENCE_BUCKET = 'property-verification';
export const PROPERTY_VIDEO_BUCKET = 'property-videos';
export const PROPERTY_PHOTO_BUCKET = 'property-photos';

const DEFAULT_EXPIRY_SECONDS = 60 * 10;

/**
 * Create a short-lived signed URL for a private storage object.
 * Returns null when the path is empty or Supabase cannot sign it.
 */
export async function createSignedStorageUrl(
  bucket: string,
  storagePath: string | null | undefined,
  expiresIn: number = DEFAULT_EXPIRY_SECONDS,
): Promise<string | null> {
  if (!storagePath) return null;
  if (/^https?:\/\//i.test(storagePath)) return storagePath;

  const supabase = getAdminClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
