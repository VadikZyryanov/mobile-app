import { supabase } from '@/lib/supabase';
import { getExerciseVideoUrl } from './getExerciseVideoUrl';

const rpcMock = supabase.rpc as jest.Mock;

describe('getExerciseVideoUrl', () => {
  beforeEach(() => rpcMock.mockReset());

  it('возвращает signed url', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'https://video', error: null });
    expect(await getExerciseVideoUrl('squat')).toBe('https://video');
    expect(rpcMock).toHaveBeenCalledWith('get_exercise_video_url', { exercise_slug: 'squat' });
  });

  it('возвращает null если нет видео', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await getExerciseVideoUrl('x')).toBeNull();
  });

  it('пробрасывает subscription required', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'subscription required' } });
    await expect(getExerciseVideoUrl('x')).rejects.toEqual({ message: 'subscription required' });
  });
});
