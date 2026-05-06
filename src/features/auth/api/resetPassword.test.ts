import { supabase } from '@/lib/supabase';

import { resetPassword } from './resetPassword';

const mock = supabase.auth.resetPasswordForEmail as jest.Mock;

describe('resetPassword', () => {
  beforeEach(() => mock.mockReset());

  it('передаёт email и redirect URL', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await resetPassword('a@b.c');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith('a@b.c', {
      redirectTo: 'fitnessapp://auth/reset-password',
    });
  });

  it('возвращает ошибку при rate limit', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'over_email_send_rate_limit', message: 'rate' },
    });
    const res = await resetPassword('a@b.c');
    expect(res).toEqual({ ok: false, error: 'Слишком много запросов, подождите минуту' });
  });
});
