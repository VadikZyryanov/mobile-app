import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import Home from './home';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('Home', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });
  });

  it('рендерит секции', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'workouts') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    id: '1',
                    slug: 'w',
                    title: 'W',
                    category: 'upper',
                    cover_path: 'c.jpg',
                    duration_minutes: 30,
                    difficulty: 2,
                    min_tier: 'basic',
                    description: '',
                    created_at: '',
                    updated_at: '',
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'programs') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    id: '1',
                    slug: 'p',
                    title: 'P',
                    description: 'd',
                    cover_path: 'c.jpg',
                    weeks: 4,
                    sessions_per_week: 3,
                    difficulty: 2,
                    min_tier: 'basic',
                    created_at: '',
                    updated_at: '',
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'blog_posts') {
        return {
          select: () => ({
            not: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: '1',
                      slug: 'b',
                      title: 'B',
                      excerpt: '',
                      body: '',
                      cover_path: 'c.jpg',
                      author_id: 'u',
                      published_at: '2026-05-01',
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
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'u1', display_name: 'Vadim', subscription_tier: 'free' },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {};
    });

    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<Home />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText(/Vadim/)).toBeTruthy();
      expect(await findByText('Рекомендуемые')).toBeTruthy();
    });
  });
});
