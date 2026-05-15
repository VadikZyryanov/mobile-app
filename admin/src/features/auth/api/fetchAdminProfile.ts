import { supabase } from '@/lib/supabase';
import type { AdminProfile } from '../store/auth.store';

export async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, is_admin, display_name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as AdminProfile) ?? null;
}
