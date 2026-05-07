import { supabase } from '@/lib/supabase';
import { listExercises } from './listExercises';

const fromMock = supabase.from as jest.Mock;

describe('listExercises', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает все упражнения, отсортированные по name', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'squat', name: 'Squat' }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    const res = await listExercises();
    expect(fromMock).toHaveBeenCalledWith('exercises');
    expect(select).toHaveBeenCalledWith('*');
    expect(order).toHaveBeenCalledWith('name', { ascending: true });
    expect(res).toEqual([{ id: '1', slug: 'squat', name: 'Squat' }]);
  });

  it('фильтрует по primary_muscle если передан', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    await listExercises('chest');
    expect(eq).toHaveBeenCalledWith('primary_muscle', 'chest');
  });

  it('бросает ошибку при error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'oops' } });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    await expect(listExercises()).rejects.toEqual({ message: 'oops' });
  });
});
