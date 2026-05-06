import { supabase } from '@/lib/supabase';

export type PublicBucket = 'workout-covers' | 'program-covers' | 'blog-media';

export function getPublicUrl(bucket: PublicBucket, path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
