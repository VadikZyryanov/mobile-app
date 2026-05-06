import { supabase } from '@/lib/supabase';

import { verifyPhoneOtp } from './verifyPhoneOtp';

const mock = supabase.auth.verifyOtp as jest.Mock;

describe('verifyPhoneOtp', () => {
  beforeEach(() => mock.mockReset());

  it('подтверждает код типа sms', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await verifyPhoneOtp('+79991234567', '123456');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ phone: '+79991234567', token: '123456', type: 'sms' });
  });

  it('возвращает локализованную ошибку при otp_expired', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'otp_expired', message: 'expired' },
    });
    const res = await verifyPhoneOtp('+79991234567', '123456');
    expect(res).toEqual({ ok: false, error: 'Код устарел, запросите новый' });
  });
});
