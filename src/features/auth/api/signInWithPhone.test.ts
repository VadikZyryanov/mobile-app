import { supabase } from '@/lib/supabase';

import { signInWithPhone } from './signInWithPhone';

const mock = supabase.auth.signInWithOtp as jest.Mock;

describe('signInWithPhone', () => {
  beforeEach(() => mock.mockReset());

  it('запрашивает OTP по номеру', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await signInWithPhone('+79991234567');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ phone: '+79991234567' });
  });

  it('возвращает ошибку при rate limit', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'over_request_rate_limit', message: 'rate' },
    });
    const res = await signInWithPhone('+79991234567');
    expect(res).toEqual({ ok: false, error: 'Слишком много запросов, подождите минуту' });
  });
});
