import { supabase } from '@/lib/supabase';

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('nutrition_entries').delete().eq('id', id);
  if (error) throw error;
}
