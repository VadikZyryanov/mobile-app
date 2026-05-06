import { supabase } from '@/lib/supabase';

import { signInWithEmail } from './signInWithEmail';

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;

describe('signInWithEmail', () => {
  beforeEach(() => mockSignIn.mockReset());

  it('возвращает ok при успехе', async () => {
    mockSignIn.mockResolvedValueOnce({ data: {}, error: null });
    const res = await signInWithEmail('a@b.c', 'pw');
    expect(res).toEqual({ ok: true });
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' });
  });

  it('возвращает локализованную ошибку при invalid_credentials', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: {},
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    const res = await signInWithEmail('a@b.c', 'pw');
    expect(res).toEqual({ ok: false, error: 'Неверный email или пароль' });
  });
});
