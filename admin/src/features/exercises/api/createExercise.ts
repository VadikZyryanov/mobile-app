import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Exercise, ExerciseInsert } from '@/types/content';

export async function createExercise(input: ExerciseInsert): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').insert(input).select('*').single();
  if (error) throw error;
  const row = data as Exercise;
  await logAdminAction('create', 'exercise', row.id, null, row);
  return row;
}
