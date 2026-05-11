import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useDailyEntries } from './useDailyEntries';

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
  food: { id: 'f1', name: 'Курица', kcal_per_100g: 165 },
};

describe('useDailyEntries', () => {
  beforeEach(() => fromMock.mockReset());

  it('не делает запрос если userId отсутствует', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useDailyEntries(undefined, '2026-05-10'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('загружает записи за день', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [ENTRY], error: null });
    const eq2 = jest.fn(() => ({ order }));
    const eq1 = jest.fn(() => ({ eq: eq2 }));
    const select = jest.fn(() => ({ eq: eq1 }));
    fromMock.mockReturnValueOnce({ select });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useDailyEntries('u1', '2026-05-10'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.food.name).toBe('Курица');
  });
});
