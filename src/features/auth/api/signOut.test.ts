import { supabase } from '@/lib/supabase';

import { signOut } from './signOut';

const mock = supabase.auth.signOut as jest.Mock;

describe('signOut', () => {
  beforeEach(() => mock.mockReset());

  it('вызывает supabase.auth.signOut', async () => {
    mock.mockResolvedValueOnce({ error: null });
    const res = await signOut();
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalled();
  });

  it('возвращает ошибку при сбое', async () => {
    mock.mockResolvedValueOnce({ error: { code: 'something', message: 'Boom' } });
    const res = await signOut();
    expect(res).toEqual({ ok: false, error: 'Boom' });
  });
});
