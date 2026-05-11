import { renderHook } from '@testing-library/react-native';
import { useDailySummary } from './useDailySummary';
import type { NutritionEntryWithFood } from '../types';

const makeEntry = (kcal: number, grams: number): NutritionEntryWithFood => ({
  id: 'e1',
  user_id: 'u1',
  food_id: 'f1',
  meal_type: 'breakfast',
  quantity_grams: grams,
  consumed_on: '2026-05-10',
  consumed_at: '2026-05-10T08:00:00Z',
  created_at: '2026-05-10T08:00:00Z',
  food: {
    id: 'f1',
    slug: 'chicken',
    name: 'Курица',
    brand: null,
    kcal_per_100g: kcal,
    protein_per_100g: 31,
    fat_per_100g: 3.6,
    carbs_per_100g: 0,
    created_at: '',
    updated_at: '',
  },
});

const TARGETS = { kcal: 2000, protein_g: 150, fat_g: 70, carbs_g: 200 };

describe('useDailySummary', () => {
  it('возвращает нулевой total при пустых entries', () => {
    const { result } = renderHook(() => useDailySummary([], TARGETS));
    expect(result.current.total).toEqual({ kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
    expect(result.current.targets).toBe(TARGETS);
  });

  it('суммирует КБЖУ записей', () => {
    const entries = [makeEntry(165, 200)];
    const { result } = renderHook(() => useDailySummary(entries, TARGETS));
    expect(result.current.total.kcal).toBe(330);
    expect(result.current.total.protein_g).toBe(62);
  });

  it('возвращает targets=null если не переданы', () => {
    const { result } = renderHook(() => useDailySummary([], null));
    expect(result.current.targets).toBeNull();
  });
});
