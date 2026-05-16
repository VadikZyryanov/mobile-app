import { supabase } from '@/lib/supabase';
import type { Food } from '@/types/content';

export async function getFoodById(id: string): Promise<Food> {
  const { data, error } = await supabase.from('foods').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Food;
}
