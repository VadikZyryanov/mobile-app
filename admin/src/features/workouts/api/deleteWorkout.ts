import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Workout } from '@/types/content';

export async function deleteWorkout(id: string): Promise<Workout> {
  const { data: before, error: beforeErr } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { data, error } = await supabase
    .from('workouts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  const after = data as Workout;
  await logAdminAction('delete', 'workout', id, before, after);
  return after;
}
