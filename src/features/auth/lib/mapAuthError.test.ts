import type { AuthError } from '@supabase/supabase-js';

import { mapAuthError } from './mapAuthError';

const make = (code: string, message = 'fallback'): AuthError =>
  ({ code, message, name: 'AuthError', status: 400 }) as unknown as AuthError;

describe('mapAuthError', () => {
  it.each([
    ['invalid_credentials', 'Неверный email или пароль'],
    ['email_not_confirmed', 'Подтвердите email'],
    ['over_email_send_rate_limit', 'Слишком много запросов, подождите минуту'],
    ['over_request_rate_limit', 'Слишком много запросов, подождите минуту'],
    ['otp_expired', 'Код устарел, запросите новый'],
    ['otp_disabled', 'Вход по коду временно недоступен'],
    ['weak_password', 'Пароль слишком простой (минимум 8 символов)'],
    ['user_already_exists', 'Аккаунт с таким email уже существует'],
  ])('код "%s" → "%s"', (code, expected) => {
    expect(mapAuthError(make(code))).toBe(expected);
  });

  it('возвращает message для неизвестного кода', () => {
    expect(mapAuthError(make('something_unknown', 'Raw msg'))).toBe('Raw msg');
  });

  it('возвращает дефолт если нет message', () => {
    const err = { code: 'x', name: 'AuthError', status: 0 } as unknown as AuthError;
    expect(mapAuthError(err)).toBe('Произошла ошибка. Попробуйте ещё раз.');
  });
});
