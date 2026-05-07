import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useProgramDetail } from './useProgramDetail';

const fromMock = supabase.from as jest.Mock;

describe('useProgramDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('disabled когда slug не передан', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useProgramDetail(undefined), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('фетчит program detail', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'p1',
        slug: '8-week',
        title: '8 недель',
        program_workouts: [],
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useProgramDetail('8-week'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.title).toBe('8 недель');
  });
});
