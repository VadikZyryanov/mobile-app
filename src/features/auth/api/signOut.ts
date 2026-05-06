import { supabase } from '@/lib/supabase';

import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
