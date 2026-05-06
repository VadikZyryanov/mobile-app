import { renderHook, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useProfile } from './useProfile';

const fromMock = supabase.from as jest.Mock;

describe('useProfile', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({ status: 'unauthenticated', user: null, session: null });
  });

  it('возвращает null если юзер не залогинен', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('фетчит profile по user.id', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });
    const single = jest.fn().mockResolvedValueOnce({
      data: { id: 'u1', display_name: 'Vadim', avatar_url: null },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('id', 'u1');
    expect(result.current.data?.display_name).toBe('Vadim');
  });
});
