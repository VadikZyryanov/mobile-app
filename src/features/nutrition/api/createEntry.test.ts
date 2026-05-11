import { supabase } from '@/lib/supabase';
import { createEntry } from './createEntry';
import type { CreateEntryInput } from './createEntry';

const fromMock = supabase.from as jest.Mock;

const INPUT: CreateEntryInput = {
  userId: 'u1',
  foodId: 'f1',
  mealType: 'breakfast',
  quantityGrams: 200,
  consumedOn: '2026-05-10',
};

const RESULT = {
  id: 'e1',
  user_id: 'u1',
  food_id: 'f1',
  meal_type: 'breakfast',
  quantity_grams: 200,
};

describe('createEntry', () => {
  beforeEach(() => fromMock.mockReset());

  it('создаёт запись и возвращает её', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: RESULT, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    fromMock.mockReturnValueOnce({ insert });

    const result = await createEntry(INPUT);
    expect(fromMock).toHaveBeenCalledWith('nutrition_entries');
    expect(result).toEqual(RESULT);
  });

  it('бросает ошибку при error (RLS denied)', async () => {
    const single = jest
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    fromMock.mockReturnValueOnce({ insert });

    await expect(createEntry(INPUT)).rejects.toEqual({ message: 'permission denied' });
  });
});
