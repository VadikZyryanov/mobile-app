import type { Database } from '@shared/lib/database.types';

export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];

export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
export type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];

export type Program = Database['public']['Tables']['programs']['Row'];
export type ProgramInsert = Database['public']['Tables']['programs']['Insert'];
export type ProgramUpdate = Database['public']['Tables']['programs']['Update'];
export type ProgramWorkout = Database['public']['Tables']['program_workouts']['Row'];

export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];
export type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];

export type Food = Database['public']['Tables']['foods']['Row'];
export type FoodInsert = Database['public']['Tables']['foods']['Insert'];
export type FoodUpdate = Database['public']['Tables']['foods']['Update'];

export type MuscleGroup = Database['public']['Enums']['muscle_group_enum'];
export type WorkoutCategory = Database['public']['Enums']['workout_category_enum'];
export type SubscriptionTier = Database['public']['Enums']['subscription_tier_enum'];

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'cardio',
] as const satisfies readonly MuscleGroup[];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Грудь',
  back: 'Спина',
  shoulders: 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  quads: 'Квадрицепсы',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  core: 'Пресс/кор',
  cardio: 'Кардио',
};

export const WORKOUT_CATEGORIES = [
  'upper',
  'lower',
  'full_body',
  'cardio',
  'core',
] as const satisfies readonly WorkoutCategory[];

export const WORKOUT_CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  upper: 'Верх',
  lower: 'Низ',
  full_body: 'Всё тело',
  cardio: 'Кардио',
  core: 'Кор',
};

export const TIER_OPTIONS = [
  'free',
  'basic',
  'pro',
  'pro_max',
] as const satisfies readonly SubscriptionTier[];

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  pro_max: 'Pro Max',
};

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Лёгкая',
  2: 'Базовая',
  3: 'Средняя',
  4: 'Сложная',
  5: 'Очень сложная',
};
