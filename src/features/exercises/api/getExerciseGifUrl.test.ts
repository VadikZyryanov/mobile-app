import { supabase } from '@/lib/supabase';
import { getExerciseGifUrl } from './getExerciseGifUrl';

const rpcMock = supabase.rpc as jest.Mock;

describe('getExerciseGifUrl', () => {
  beforeEach(() => rpcMock.mockReset());

  it('возвращает signed url', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'https://signed', error: null });
    const url = await getExerciseGifUrl('squat');
    expect(rpcMock).toHaveBeenCalledWith('get_exercise_gif_url', { exercise_slug: 'squat' });
    expect(url).toBe('https://signed');
  });

  it('возвращает null если нет gif', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await getExerciseGifUrl('x')).toBeNull();
  });

  it('бросает ошибку при error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    await expect(getExerciseGifUrl('x')).rejects.toEqual({ message: 'e' });
  });
});
