import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types/content';

export async function getExerciseById(id: string): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Exercise;
}
