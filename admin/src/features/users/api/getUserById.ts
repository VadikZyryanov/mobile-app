import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/shared';

export async function getUserById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as unknown as Profile) ?? null;
}
