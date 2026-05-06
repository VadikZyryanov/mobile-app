import { renderHook, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useUpdateProfile } from './useUpdateProfile';

const fromMock = supabase.from as jest.Mock;

describe('useUpdateProfile', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1' } as never,
      session: {} as never,
    });
  });

  it('обновляет profile и инвалидирует кеш', async () => {
    const eq = jest.fn().mockResolvedValueOnce({ data: null, error: null });
    const update = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ update });

    const { Wrapper, client } = makeQueryWrapper();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper });
    await result.current.mutateAsync({ display_name: 'New' });

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith({ display_name: 'New' });
    expect(eq).toHaveBeenCalledWith('id', 'u1');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile', 'u1'] }),
    );
  });
});
