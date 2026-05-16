import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Exercise, ExerciseUpdate } from '@/types/content';

export async function updateExercise(id: string, patch: ExerciseUpdate): Promise<Exercise> {
  const { data: before, error: beforeErr } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { data, error } = await supabase
    .from('exercises')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const after = data as Exercise;
  await logAdminAction('update', 'exercise', id, before, after);
  return after;
}
