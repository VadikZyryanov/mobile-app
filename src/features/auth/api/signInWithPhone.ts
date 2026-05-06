import { supabase } from '@/lib/supabase';

import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signInWithPhone(phone: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
