import { supabase } from '@/lib/supabase';
import type { NutritionEntry, MealType } from '../types';

export interface UpdateEntryInput {
  id: string;
  quantityGrams?: number;
  mealType?: MealType;
}

export async function updateEntry(input: UpdateEntryInput): Promise<NutritionEntry> {
  const { data, error } = await supabase
    .from('nutrition_entries')
    .update({
      ...(input.quantityGrams !== undefined && { quantity_grams: input.quantityGrams }),
      ...(input.mealType !== undefined && { meal_type: input.mealType }),
    })
    .eq('id', input.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
