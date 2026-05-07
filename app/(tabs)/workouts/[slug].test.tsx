import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import WorkoutDetail from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'upper-power' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('WorkoutDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('рендерит детали и упражнения', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'w',
        slug: 'upper-power',
        title: 'Upper Power',
        description: 'desc',
        category: 'upper',
        cover_path: 'c.jpg',
        duration_minutes: 45,
        difficulty: 3,
        min_tier: 'basic',
        created_at: '',
        updated_at: '',
        workout_exercises: [
          {
            workout_id: 'w',
            position: 1,
            exercise_id: 'e1',
            sets: 4,
            reps: '6-8',
            rest_seconds: 120,
            notes: null,
            exercise: { slug: 'squat', name: 'Squat' },
          },
        ],
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });

    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<WorkoutDetail />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Upper Power')).toBeTruthy();
      expect(await findByText('Squat')).toBeTruthy();
    });
  });
});
