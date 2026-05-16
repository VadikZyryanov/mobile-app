import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Food, FoodInsert } from '@/types/content';

export async function createFood(input: FoodInsert): Promise<Food> {
  const { data, error } = await supabase.from('foods').insert(input).select('*').single();
  if (error) throw error;
  const row = data as Food;
  await logAdminAction('create', 'food', row.id, null, row);
  return row;
}
