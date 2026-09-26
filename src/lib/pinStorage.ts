import { supabase, isDemoMode } from './supabase';
import { AppError } from './errors';

export const PIN_IMAGES_BUCKET = 'pin-images';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function dataUrlToBlob(dataUrl: string): { blob: Blob; extension: string } {
  const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new AppError('IMAGE_UPLOAD_FAILED', 'Unsupported image data URL');
  const mime = match[1].toLowerCase();
  const binary = atob(match[3]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (bytes.length > MAX_UPLOAD_BYTES) throw new AppError('IMAGE_UPLOAD_FAILED', 'Image too large');
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return { blob: new Blob([bytes], { type: mime }), extension };
}

/**
 * Makes sure a pin image is a public https URL before it is stored in `pins`.
 * Browser-composed images (data: URLs) are uploaded to Supabase Storage under
 * the user's own folder; Pinterest can then fetch them directly.
 */
export async function persistPinImage(imageUrl: string, userId: string): Promise<string> {
  if (!imageUrl.startsWith('data:')) return imageUrl;
  if (isDemoMode) return imageUrl;

  const { blob, extension } = dataUrlToBlob(imageUrl);
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(PIN_IMAGES_BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new AppError('IMAGE_UPLOAD_FAILED', error.message);

  const { data } = supabase.storage.from(PIN_IMAGES_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new AppError('IMAGE_UPLOAD_FAILED', 'No public URL');
  return data.publicUrl;
}
