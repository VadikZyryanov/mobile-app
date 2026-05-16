import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Food } from '@/types/content';

export async function restoreFood(id: string): Promise<Food> {
  const { data: before, error: beforeErr } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { data, error } = await supabase
    .from('foods')
    .update({ deleted_at: null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const after = data as Food;
  await logAdminAction('restore', 'food', id, before, after);
  return after;
}
