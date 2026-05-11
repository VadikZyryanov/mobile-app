import { supabase } from '@/lib/supabase';
import type { NutritionEntryWithFood } from '../types';

export async function listEntriesForDate(
  userId: string,
  date: string,
): Promise<NutritionEntryWithFood[]> {
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('*, food:foods(*)')
    .eq('user_id', userId)
    .eq('consumed_on', date)
    .order('consumed_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as NutritionEntryWithFood[];
}
