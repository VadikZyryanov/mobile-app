import { supabase } from '@/lib/supabase';
import { listFoods } from './listFoods';

const fromMock = supabase.from as jest.Mock;

describe('listFoods', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает все продукты без фильтра', async () => {
    const limit = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: '1', name: 'Курица' }], error: null });
    const order = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    const result = await listFoods();
    expect(fromMock).toHaveBeenCalledWith('foods');
    expect(result).toEqual([{ id: '1', name: 'Курица' }]);
  });

  it('применяет ilike-фильтр при наличии q', async () => {
    const limit = jest.fn().mockResolvedValueOnce({ data: [], error: null });
    const order = jest.fn(() => ({ limit }));
    const ilike = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ ilike }));
    fromMock.mockReturnValueOnce({ select });

    await listFoods('курица');
    expect(ilike).toHaveBeenCalledWith('name', '%курица%');
  });

  it('бросает ошибку при error', async () => {
    const limit = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'db error' } });
    const order = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    await expect(listFoods()).rejects.toEqual({ message: 'db error' });
  });
});
