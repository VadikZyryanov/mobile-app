import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Food, FoodUpdate } from '@/types/content';

export async function updateFood(id: string, patch: FoodUpdate): Promise<Food> {
  const { data: before, error: beforeErr } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { data, error } = await supabase
    .from('foods')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const after = data as Food;
  await logAdminAction('update', 'food', id, before, after);
  return after;
}
