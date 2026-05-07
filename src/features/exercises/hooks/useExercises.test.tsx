import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useExercises } from './useExercises';

const fromMock = supabase.from as jest.Mock;

describe('useExercises', () => {
  beforeEach(() => fromMock.mockReset());

  it('фетчит и возвращает упражнения', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'squat', name: 'Squat' }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useExercises(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
  });
});
