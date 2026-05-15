import { describe, expect, it, vi, beforeEach } from 'vitest';

const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...a: unknown[]) => signInWithPasswordMock(...a),
      signOut: (...a: unknown[]) => signOutMock(...a),
    },
    from: (...a: unknown[]) => (fromMock as (...args: unknown[]) => unknown)(...a),
  },
}));

import { signInAdmin, FORBIDDEN_NOT_ADMIN } from './signInAdmin';

const sessionFixture = {
  access_token: 'x',
  refresh_token: 'y',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: 'u1' },
};

describe('signInAdmin', () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset().mockResolvedValue({ error: null });
    maybeSingleMock.mockReset();
  });

  it('admin profile → возвращает session + profile', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: sessionFixture, user: sessionFixture.user },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: 'u1', is_admin: true, display_name: 'A', email: 'a@b.c' },
      error: null,
    });

    const res = await signInAdmin('a@b.c', 'secret123');
    expect(res.profile.is_admin).toBe(true);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('не-админ → signOut + throw FORBIDDEN_NOT_ADMIN', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: sessionFixture, user: sessionFixture.user },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: 'u1', is_admin: false, display_name: 'A', email: 'a@b.c' },
      error: null,
    });

    await expect(signInAdmin('a@b.c', 'secret123')).rejects.toMatchObject({
      message: FORBIDDEN_NOT_ADMIN,
    });
    expect(signOutMock).toHaveBeenCalled();
  });

  it('signIn error → пробрасывает', async () => {
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: new Error('invalid creds') });
    await expect(signInAdmin('a@b.c', 'wrong')).rejects.toThrow('invalid creds');
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('profile fetch error → signOut + throw', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: sessionFixture, user: sessionFixture.user },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: new Error('rls') });
    await expect(signInAdmin('a@b.c', 'secret123')).rejects.toThrow('rls');
    expect(signOutMock).toHaveBeenCalled();
  });
});
