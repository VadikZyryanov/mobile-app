import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import AddEntryScreen from './add';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ meal: 'breakfast', date: '2026-05-11' }),
}));

const fromMock = supabase.from as jest.Mock;

describe('AddEntryScreen', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'foods') {
        return {
          select: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it('рендерит экран добавления продукта', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<AddEntryScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Добавить продукт')).toBeTruthy();
    });
  });

  it('показывает список продуктов после загрузки', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'foods') {
        return {
          select: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: [
                    {
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
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      return {};
    });

    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<AddEntryScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Куриная грудка')).toBeTruthy();
    });
  });
});
