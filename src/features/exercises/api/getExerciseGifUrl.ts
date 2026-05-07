import { supabase } from '@/lib/supabase';

export async function getExerciseGifUrl(slug: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_exercise_gif_url', { exercise_slug: slug });
  if (error) throw error;
  return data ?? null;
}
