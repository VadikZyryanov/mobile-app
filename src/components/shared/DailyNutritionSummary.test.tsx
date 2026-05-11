import { render, screen, fireEvent } from '@testing-library/react-native';
import { DailyNutritionSummary } from './DailyNutritionSummary';
import { ThemeProvider } from '@/theme';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const TOTAL = { kcal: 1200, protein_g: 90, fat_g: 40, carbs_g: 150 };
const TARGETS = { kcal: 2000, protein_g: 150, fat_g: 70, carbs_g: 200 };

describe('DailyNutritionSummary', () => {
  it('рендерит заголовок и ккал', () => {
    render(<DailyNutritionSummary total={TOTAL} targets={TARGETS} />, { wrapper: Wrapper });
    expect(screen.getByText('Питание сегодня')).toBeTruthy();
    expect(screen.getAllByText('1200').length).toBeGreaterThanOrEqual(1);
  });

  it('в compact-режиме не показывает БЖУ прогресс-бары', () => {
    render(<DailyNutritionSummary total={TOTAL} targets={TARGETS} compact />, { wrapper: Wrapper });
    expect(screen.queryByText('Белки')).toBeNull();
  });

  it('вызывает onPress при нажатии', () => {
    const onPress = jest.fn();
    render(<DailyNutritionSummary total={TOTAL} targets={TARGETS} compact onPress={onPress} />, {
      wrapper: Wrapper,
    });
    fireEvent.press(screen.getByText('Открыть дневник →'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('рендерит без targets без ошибок', () => {
    render(<DailyNutritionSummary total={TOTAL} targets={null} />, { wrapper: Wrapper });
    expect(screen.getByText('Питание сегодня')).toBeTruthy();
  });
});
