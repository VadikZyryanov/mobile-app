import { supabase } from '@/lib/supabase';

import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
