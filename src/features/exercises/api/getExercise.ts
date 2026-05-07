import { supabase } from '@/lib/supabase';
import type { Exercise } from '../types';

export async function getExercise(slug: string): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}
