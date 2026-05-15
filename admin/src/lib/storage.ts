import { supabase } from '@/lib/supabase';

export type AdminBucket = 'exercise-media' | 'workout-covers' | 'program-covers' | 'blog-media';

export const PUBLIC_BUCKETS: ReadonlySet<AdminBucket> = new Set([
  'workout-covers',
  'program-covers',
  'blog-media',
]);

export function isPublicBucket(bucket: AdminBucket): boolean {
  return PUBLIC_BUCKETS.has(bucket);
}

export async function uploadFile(
  bucket: AdminBucket,
  file: File,
  path: string,
): Promise<{ path: string }> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path: data.path };
}

export async function deleteFile(bucket: AdminBucket, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export function getPublicUrl(bucket: AdminBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSignedUrl(
  bucket: AdminBucket,
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export function generateStoragePath(prefix: string, filename: string): string {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}/${Date.now()}-${safe || 'file'}`;
}
