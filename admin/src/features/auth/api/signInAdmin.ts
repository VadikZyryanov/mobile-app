import { supabase } from '@/lib/supabase';
import type { AdminProfile } from '../store/auth.store';
import type { Session } from '@supabase/supabase-js';

export const FORBIDDEN_NOT_ADMIN = 'FORBIDDEN_NOT_ADMIN';

export interface SignInResult {
  session: Session;
  profile: AdminProfile;
}

export async function signInAdmin(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session || !data.user) {
    throw new Error('Empty session after signIn');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_admin, display_name, email')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw profileError ?? new Error('Profile not found');
  }

  const adminProfile = profile as unknown as AdminProfile;
  if (!adminProfile.is_admin) {
    await supabase.auth.signOut();
    const err = new Error(FORBIDDEN_NOT_ADMIN);
    err.name = FORBIDDEN_NOT_ADMIN;
    throw err;
  }

  return { session: data.session, profile: adminProfile };
}
