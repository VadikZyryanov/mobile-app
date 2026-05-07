import { renderHook, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';

import { useBlogPosts } from './useBlogPosts';

const fromMock = supabase.from as jest.Mock;

describe('useBlogPosts', () => {
  beforeEach(() => fromMock.mockReset());

  it('фетчит', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'p' }],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ not: () => ({ order }) }) });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useBlogPosts(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
