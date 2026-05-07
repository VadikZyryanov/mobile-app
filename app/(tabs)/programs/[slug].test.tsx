import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import ProgramDetail from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: '8-week' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('ProgramDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('рендерит расписание', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'p',
        slug: '8-week',
        title: '8 недель',
        description: 'd',
        cover_path: 'c.jpg',
        weeks: 8,
        sessions_per_week: 3,
        difficulty: 3,
        min_tier: 'pro',
        created_at: '',
        updated_at: '',
        program_workouts: [
          {
            program_id: 'p',
            week: 1,
            day_of_week: 1,
            workout_id: 'w1',
            workout: { slug: 'upper-power', title: 'Upper' },
          },
        ],
      },
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ single }) }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ProgramDetail />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('8 недель')).toBeTruthy();
      expect(await findByText('Upper')).toBeTruthy();
    });
  });
});
