import { supabase } from '@/lib/supabase';
import type { WorkoutDetail } from '../types';

export async function getWorkoutDetail(slug: string): Promise<WorkoutDetail> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      `
      *,
      workout_exercises (
        workout_id, position, exercise_id, sets, reps, rest_seconds, notes,
        exercise:exercises ( slug, name )
      )
    `,
    )
    .eq('slug', slug)
    .single();
  if (error) throw error;
  const sorted = [...((data.workout_exercises as WorkoutDetail['exercises']) ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  return { ...data, exercises: sorted } as WorkoutDetail;
}
