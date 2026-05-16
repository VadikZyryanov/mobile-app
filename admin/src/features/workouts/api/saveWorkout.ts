import { supabase } from '@/lib/supabase';
import type { Json } from '@shared/lib/database.types';

export interface SaveWorkoutInput {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  cover_path?: string | null;
  duration_minutes: number;
  difficulty: number;
  min_tier: string;
}

export interface SaveWorkoutExerciseInput {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string | null;
}

export async function saveWorkout(
  workout: SaveWorkoutInput,
  exercises: SaveWorkoutExerciseInput[],
): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc('admin_save_workout_with_exercises', {
    p_workout: workout as unknown as Json,
    p_exercises: exercises as unknown as Json,
  });
  if (error) throw error;
  const result = data as { id: string } | null;
  if (!result?.id) throw new Error('RPC вернул пустой результат');
  return { id: result.id };
}
