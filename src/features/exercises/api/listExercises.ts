import { supabase } from '@/lib/supabase';
import type { Exercise, MuscleGroup } from '../types';

export async function listExercises(filter?: MuscleGroup): Promise<Exercise[]> {
  const builder = supabase.from('exercises').select('*');
  const query = filter ? builder.eq('primary_muscle', filter) : builder;
  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
