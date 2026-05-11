import { render, screen, fireEvent } from '@testing-library/react-native';
import { FoodEntryRow } from './FoodEntryRow';
import { ThemeProvider } from '@/theme';
import type { NutritionEntryWithFood } from '@/features/nutrition/types';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const ENTRY: NutritionEntryWithFood = {
  id: 'e1',
  user_id: 'u1',
  food_id: 'f1',
  meal_type: 'breakfast',
  quantity_grams: 200,
  consumed_on: '2026-05-10',
  consumed_at: '2026-05-10T08:00:00Z',
  created_at: '2026-05-10T08:00:00Z',
  food: {
    id: 'f1',
    slug: 'chicken',
    name: 'Куриная грудка',
    brand: null,
    kcal_per_100g: 165,
    protein_per_100g: 31,
    fat_per_100g: 3.6,
    carbs_per_100g: 0,
    created_at: '',
    updated_at: '',
  },
};

describe('FoodEntryRow', () => {
  it('рендерит название и ккал', () => {
    render(<FoodEntryRow entry={ENTRY} />, { wrapper: Wrapper });
    expect(screen.getByText('Куриная грудка')).toBeTruthy();
    expect(screen.getByText('330 ккал')).toBeTruthy();
  });

  it('вызывает onDelete с id при нажатии', () => {
    const onDelete = jest.fn();
    render(<FoodEntryRow entry={ENTRY} onDelete={onDelete} />, { wrapper: Wrapper });
    fireEvent.press(screen.getByText('✕'));
    expect(onDelete).toHaveBeenCalledWith('e1');
  });
});
