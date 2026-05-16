import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Food } from '@/types/content';

export async function deleteFood(id: string): Promise<Food> {
  const { data: before, error: beforeErr } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { data, error } = await supabase
    .from('foods')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const after = data as Food;
  await logAdminAction('delete', 'food', id, before, after);
  return after;
}
