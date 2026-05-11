import { supabase } from '@/lib/supabase';
import { listEntriesForDate } from './listEntriesForDate';

const fromMock = supabase.from as jest.Mock;

const ENTRY = {
  id: 'e1',
  user_id: 'u1',
  food_id: 'f1',
  meal_type: 'breakfast',
  quantity_grams: 200,
  consumed_on: '2026-05-10',
  consumed_at: '2026-05-10T08:00:00Z',
  created_at: '2026-05-10T08:00:00Z',
  food: { id: 'f1', name: 'Куриная грудка', kcal_per_100g: 165 },
};

describe('listEntriesForDate', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает пустой массив если нет записей', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [], error: null });
    const eq2 = jest.fn(() => ({ order }));
    const eq1 = jest.fn(() => ({ eq: eq2 }));
    const select = jest.fn(() => ({ eq: eq1 }));
    fromMock.mockReturnValueOnce({ select });

    const result = await listEntriesForDate('u1', '2026-05-10');
    expect(result).toEqual([]);
  });

  it('возвращает записи с joined food', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [ENTRY], error: null });
    const eq2 = jest.fn(() => ({ order }));
    const eq1 = jest.fn(() => ({ eq: eq2 }));
    const select = jest.fn(() => ({ eq: eq1 }));
    fromMock.mockReturnValueOnce({ select });

    const result = await listEntriesForDate('u1', '2026-05-10');
    expect(result).toHaveLength(1);
    expect(result[0]?.food.name).toBe('Куриная грудка');
  });

  it('бросает ошибку при error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'oops' } });
    const eq2 = jest.fn(() => ({ order }));
    const eq1 = jest.fn(() => ({ eq: eq2 }));
    const select = jest.fn(() => ({ eq: eq1 }));
    fromMock.mockReturnValueOnce({ select });

    await expect(listEntriesForDate('u1', '2026-05-10')).rejects.toEqual({ message: 'oops' });
  });
});
