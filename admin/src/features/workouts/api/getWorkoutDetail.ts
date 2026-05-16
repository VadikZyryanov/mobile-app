import { supabase } from '@/lib/supabase';
import type { Workout } from '@/types/content';

export interface WorkoutExerciseRow {
  workout_id: string;
  position: number;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string | null;
  exercise: { id: string; slug: string; name: string } | null;
}

export type WorkoutDetail = Workout & { workout_exercises: WorkoutExerciseRow[] };

export async function getWorkoutDetail(id: string): Promise<WorkoutDetail> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      '*, workout_exercises(workout_id, position, exercise_id, sets, reps, rest_seconds, notes, exercise:exercises(id, slug, name))',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  const row = data as unknown as WorkoutDetail;
  row.workout_exercises = [...(row.workout_exercises ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  return row;
}
