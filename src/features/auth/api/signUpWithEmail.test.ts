import { supabase } from '@/lib/supabase';

import { signUpWithEmail } from './signUpWithEmail';

const mock = supabase.auth.signUp as jest.Mock;

describe('signUpWithEmail', () => {
  beforeEach(() => mock.mockReset());

  it('передаёт email и password без displayName', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await signUpWithEmail('a@b.c', 'pw12345678');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw12345678' });
  });

  it('передаёт display_name через options.data', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    await signUpWithEmail('a@b.c', 'pw12345678', 'Vadim');
    expect(mock).toHaveBeenCalledWith({
      email: 'a@b.c',
      password: 'pw12345678',
      options: { data: { display_name: 'Vadim' } },
    });
  });

  it('возвращает локализованную ошибку при weak_password', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'weak_password', message: 'weak' },
    });
    const res = await signUpWithEmail('a@b.c', '123');
    expect(res).toEqual({ ok: false, error: 'Пароль слишком простой (минимум 8 символов)' });
  });
});
