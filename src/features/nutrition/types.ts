import type { Database } from '@/lib/database.types';

export type Food = Database['public']['Tables']['foods']['Row'];
export type NutritionEntry = Database['public']['Tables']['nutrition_entries']['Row'];
export type MealType = Database['public']['Enums']['meal_type_enum'];

export interface NutritionEntryWithFood extends NutritionEntry {
  food: Food;
}
