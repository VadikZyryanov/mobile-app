import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import NutritionTargetsScreen from './targets';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

const fromMock = supabase.from as jest.Mock;

describe('NutritionTargetsScreen', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: 'u1',
                    display_name: 'Test',
                    subscription_tier: 'pro_max',
                    sex: null,
                    birth_date: null,
                    height_cm: null,
                    weight_kg: null,
                    activity_level: null,
                    weight_goal: null,
                    kcal_target: null,
                    protein_g_target: null,
                    fat_g_target: null,
                    carbs_g_target: null,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it('рендерит форму целей питания', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<NutritionTargetsScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Цели питания')).toBeTruthy();
      expect(await findByText('Пол')).toBeTruthy();
    });
  });

  it('показывает опции активности', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<NutritionTargetsScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Умеренная')).toBeTruthy();
    });
  });
});
