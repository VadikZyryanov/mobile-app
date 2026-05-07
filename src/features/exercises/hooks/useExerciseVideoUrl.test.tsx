import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useExerciseVideoUrl } from './useExerciseVideoUrl';

const rpcMock = supabase.rpc as jest.Mock;

describe('useExerciseVideoUrl', () => {
  beforeEach(() => rpcMock.mockReset());

  it('disabled пока enabled=false', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useExerciseVideoUrl('squat', false), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('фетчит url когда enabled=true', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'https://v', error: null });
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useExerciseVideoUrl('squat', true), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toBe('https://v'));
  });
});
