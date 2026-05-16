import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Exercise } from '@/types/content';

export async function restoreExercise(id: string): Promise<Exercise> {
  const { data: before, error: beforeErr } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { data, error } = await supabase
    .from('exercises')
    .update({ deleted_at: null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const after = data as Exercise;
  await logAdminAction('restore', 'exercise', id, before, after);
  return after;
}
