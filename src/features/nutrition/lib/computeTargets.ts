import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Sex = Database['public']['Enums']['sex_enum'];
type Activity = Database['public']['Enums']['activity_level_enum'];
type Goal = Database['public']['Enums']['weight_goal_enum'];

export interface Targets {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -0.15,
  maintain: 0,
  gain: 0.1,
};

export function computeBMR(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  // Mifflin–St Jeor
  return sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
}

type ProfileSubset = Pick<
  Profile,
  | 'sex'
  | 'birth_date'
  | 'height_cm'
  | 'weight_kg'
  | 'activity_level'
  | 'weight_goal'
  | 'kcal_target'
  | 'protein_g_target'
  | 'fat_g_target'
  | 'carbs_g_target'
>;

export function computeTargets(profile: ProfileSubset, today: Date = new Date()): Targets | null {
  if (
    profile.kcal_target != null &&
    profile.protein_g_target != null &&
    profile.fat_g_target != null &&
    profile.carbs_g_target != null
  ) {
    return {
      kcal: profile.kcal_target,
      protein_g: profile.protein_g_target,
      fat_g: profile.fat_g_target,
      carbs_g: profile.carbs_g_target,
    };
  }

  if (
    !profile.sex ||
    !profile.birth_date ||
    !profile.height_cm ||
    !profile.weight_kg ||
    !profile.activity_level ||
    !profile.weight_goal
  ) {
    return null;
  }

  const ageMs = today.getTime() - new Date(profile.birth_date).getTime();
  const ageYears = Math.floor(ageMs / (365.25 * 24 * 3600e3));

  const bmr = computeBMR(profile.sex, Number(profile.weight_kg), profile.height_cm, ageYears);
  const tdee = bmr * ACTIVITY_FACTOR[profile.activity_level];
  const kcal = Math.round(tdee * (1 + GOAL_DELTA[profile.weight_goal]));

  const protein_g = Math.round(Number(profile.weight_kg) * 1.8);
  const fat_g = Math.round(Number(profile.weight_kg) * 1.0);
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));

  return { kcal, protein_g, fat_g, carbs_g };
}
