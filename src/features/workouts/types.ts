import type { Database } from '@/lib/database.types';

export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutCategory = Database['public']['Enums']['workout_category_enum'];
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];

export type WorkoutDetail = Workout & {
  exercises: Array<
    WorkoutExercise & {
      exercise: { slug: string; name: string };
    }
  >;
};
