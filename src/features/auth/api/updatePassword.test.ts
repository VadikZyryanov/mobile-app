import { supabase } from '@/lib/supabase';

import { updatePassword } from './updatePassword';

const mock = supabase.auth.updateUser as jest.Mock;

describe('updatePassword', () => {
  beforeEach(() => mock.mockReset());

  it('передаёт новый пароль', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await updatePassword('newpassword123');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ password: 'newpassword123' });
  });

  it('возвращает локализованную ошибку при weak_password', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'weak_password', message: 'weak' },
    });
    const res = await updatePassword('123');
    expect(res).toEqual({ ok: false, error: 'Пароль слишком простой (минимум 8 символов)' });
  });
});
