import { supabase } from '@/lib/supabase';
import { getExercise } from './getExercise';

const fromMock = supabase.from as jest.Mock;

describe('getExercise', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает exercise по slug', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: { id: '1', slug: 'squat' },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    const res = await getExercise('squat');
    expect(fromMock).toHaveBeenCalledWith('exercises');
    expect(eq).toHaveBeenCalledWith('slug', 'squat');
    expect(res).toEqual({ id: '1', slug: 'squat' });
  });

  it('бросает ошибку при error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'nf' } });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    await expect(getExercise('x')).rejects.toEqual({ message: 'nf' });
  });
});
