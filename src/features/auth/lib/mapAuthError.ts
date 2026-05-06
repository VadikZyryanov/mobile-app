import type { AuthError } from '@supabase/supabase-js';

const MAP: Record<string, string> = {
  invalid_credentials: 'Неверный email или пароль',
  email_not_confirmed: 'Подтвердите email',
  over_email_send_rate_limit: 'Слишком много запросов, подождите минуту',
  over_request_rate_limit: 'Слишком много запросов, подождите минуту',
  otp_expired: 'Код устарел, запросите новый',
  otp_disabled: 'Вход по коду временно недоступен',
  weak_password: 'Пароль слишком простой (минимум 8 символов)',
  user_already_exists: 'Аккаунт с таким email уже существует',
};

export function mapAuthError(error: AuthError): string {
  const mapped = error.code ? MAP[error.code] : undefined;
  if (mapped) return mapped;
  if (error.message) return error.message;
  return 'Произошла ошибка. Попробуйте ещё раз.';
}
