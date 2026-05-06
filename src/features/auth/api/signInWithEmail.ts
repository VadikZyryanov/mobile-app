import { supabase } from '@/lib/supabase';

import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
