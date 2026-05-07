import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useWorkouts } from './useWorkouts';

const fromMock = supabase.from as jest.Mock;

describe('useWorkouts', () => {
  beforeEach(() => fromMock.mockReset());

  it('фетчит', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'a' }],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useWorkouts(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
