import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import NutritionScreen from './index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const fromMock = supabase.from as jest.Mock;

function mockProfileWithTier(tier: string) {
  fromMock.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { id: 'u1', display_name: 'Test', subscription_tier: tier },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'nutrition_entries') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      };
    }
    return {};
  });
}

describe('NutritionScreen', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });
  });

  it('показывает paywall для free-пользователя', async () => {
    mockProfileWithTier('free');
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<NutritionScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText(/Pro Max/i)).toBeTruthy();
    });
  });

  it('показывает paywall для pro-пользователя', async () => {
    mockProfileWithTier('pro');
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<NutritionScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText(/Pro Max/i)).toBeTruthy();
    });
  });

  it('рендерит дневник для pro_max-пользователя', async () => {
    mockProfileWithTier('pro_max');
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<NutritionScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Сегодня')).toBeTruthy();
      expect(await findByText('Завтрак')).toBeTruthy();
      expect(await findByText('Обед')).toBeTruthy();
    });
  });
});
