import { supabase } from '@/lib/supabase';

import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

const REDIRECT_URL = 'fitnessapp://auth/reset-password';

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: REDIRECT_URL,
  });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
