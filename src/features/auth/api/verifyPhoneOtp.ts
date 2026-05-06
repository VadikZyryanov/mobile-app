import { supabase } from '@/lib/supabase';

import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function verifyPhoneOtp(phone: string, token: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
