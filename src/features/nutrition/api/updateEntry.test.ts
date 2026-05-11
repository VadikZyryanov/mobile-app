import { supabase } from '@/lib/supabase';
import { updateEntry } from './updateEntry';

const fromMock = supabase.from as jest.Mock;

describe('updateEntry', () => {
  beforeEach(() => fromMock.mockReset());

  it('обновляет quantity и возвращает запись', async () => {
    const UPDATED = { id: 'e1', quantity_grams: 300 };
    const single = jest.fn().mockResolvedValueOnce({ data: UPDATED, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ update });

    const result = await updateEntry({ id: 'e1', quantityGrams: 300 });
    expect(eq).toHaveBeenCalledWith('id', 'e1');
    expect(result).toEqual(UPDATED);
  });

  it('бросает ошибку при error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'error' } });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ update });

    await expect(updateEntry({ id: 'e1', quantityGrams: 100 })).rejects.toEqual({
      message: 'error',
    });
  });
});
