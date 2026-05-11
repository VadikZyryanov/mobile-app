import { supabase } from '@/lib/supabase';
import type { Food } from '../types';

export async function listFoods(q?: string): Promise<Food[]> {
  const builder = supabase.from('foods').select('*');
  const query = q?.trim() ? builder.ilike('name', `%${q.trim()}%`) : builder;
  const { data, error } = await query.order('name', { ascending: true }).limit(50);
  if (error) throw error;
  return data ?? [];
}
