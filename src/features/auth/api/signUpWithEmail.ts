import { supabase } from '@/lib/supabase';

import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    ...(displayName ? { options: { data: { display_name: displayName } } } : {}),
  });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
