import { supabase } from '@/lib/supabase';
import { signOut as signOutApi } from '@/features/auth/api/signOut';
import { useAuthStore } from './auth.store';

jest.mock('@/features/auth/api/signOut');

const getSession = supabase.auth.getSession as jest.Mock;
const onAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const signOutMock = signOutApi as jest.Mock;

const reset = () => {
  useAuthStore.setState({ status: 'loading', session: null, user: null });
  getSession.mockReset();
  onAuthStateChange.mockReset();
  signOutMock.mockReset();
  onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
};

describe('useAuthStore', () => {
  beforeEach(reset);

  it('начинается с status=loading', () => {
    expect(useAuthStore.getState().status).toBe('loading');
  });

  it('hydrate без сессии → unauthenticated', async () => {
    getSession.mockResolvedValueOnce({ data: { session: null } });
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.status).toBe('unauthenticated');
    expect(s.user).toBeNull();
    expect(s.session).toBeNull();
  });

  it('hydrate с сессией → authenticated', async () => {
    const fakeSession = { access_token: 't', user: { id: 'u1', email: 'a@b.c' } };
    getSession.mockResolvedValueOnce({ data: { session: fakeSession } });
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.status).toBe('authenticated');
    expect(s.user?.id).toBe('u1');
    expect(s.session).toBe(fakeSession);
  });

  it('onAuthStateChange callback обновляет стор', async () => {
    getSession.mockResolvedValueOnce({ data: { session: null } });
    let cb: ((event: string, session: unknown) => void) | undefined;
    onAuthStateChange.mockImplementationOnce((fn: (event: string, session: unknown) => void) => {
      cb = fn;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    await useAuthStore.getState().hydrate();
    expect(cb).toBeDefined();

    const newSession = { access_token: 'x', user: { id: 'u2' } };
    cb!('SIGNED_IN', newSession);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user?.id).toBe('u2');

    cb!('SIGNED_OUT', null);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('signOut делегирует в api', async () => {
    signOutMock.mockResolvedValueOnce({ ok: true });
    await useAuthStore.getState().signOut();
    expect(signOutMock).toHaveBeenCalled();
  });
});
