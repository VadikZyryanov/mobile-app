import { supabase } from '@/lib/supabase';
import { listWorkouts } from './listWorkouts';

const fromMock = supabase.from as jest.Mock;

describe('listWorkouts', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает workouts по убыванию created_at', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'a' }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    const res = await listWorkouts();
    expect(fromMock).toHaveBeenCalledWith('workouts');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toHaveLength(1);
  });

  it('фильтрует по category', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    await listWorkouts('upper');
    expect(eq).toHaveBeenCalledWith('category', 'upper');
  });

  it('бросает error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });
    await expect(listWorkouts()).rejects.toEqual({ message: 'e' });
  });
});
