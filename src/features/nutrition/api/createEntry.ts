import { supabase } from '@/lib/supabase';
import type { NutritionEntry, MealType } from '../types';

export interface CreateEntryInput {
  userId: string;
  foodId: string;
  mealType: MealType;
  quantityGrams: number;
  consumedOn: string;
}

export async function createEntry(input: CreateEntryInput): Promise<NutritionEntry> {
  const { data, error } = await supabase
    .from('nutrition_entries')
    .insert({
      user_id: input.userId,
      food_id: input.foodId,
      meal_type: input.mealType,
      quantity_grams: input.quantityGrams,
      consumed_on: input.consumedOn,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
