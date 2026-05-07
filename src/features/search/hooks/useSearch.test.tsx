import { renderHook, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';

import { useSearch } from './useSearch';

const rpcMock = supabase.rpc as jest.Mock;

describe('useSearch', () => {
  beforeEach(() => rpcMock.mockReset());

  it('disabled при пустом query', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useSearch(''), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('фетчит при query >= 2 символов', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          kind: 'workout',
          id: '1',
          slug: 'a',
          title: 'A',
          subtitle: 'upper',
          cover_path: null,
          min_tier: 'basic',
          rank: 1,
        },
      ],
      error: null,
    });
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useSearch('appppp'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
