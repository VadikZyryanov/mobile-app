import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import ExerciseScreen from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'squat' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('expo-video', () => ({
  VideoView: () => null,
  useVideoPlayer: () => ({ play: jest.fn() }),
}));

const fromMock = supabase.from as jest.Mock;
const rpcMock = supabase.rpc as jest.Mock;

describe('ExerciseScreen', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });
  });

  function setupExercise(min_tier: string, profile_tier: string) {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: '1',
        slug: 'squat',
        name: 'Squat',
        description: 'desc',
        primary_muscle: 'quads',
        secondary_muscles: ['glutes'],
        equipment: ['barbell'],
        gif_path: 'g.gif',
        video_path: 'v.mp4',
        min_tier,
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockImplementation((table: string) => {
      if (table === 'exercises') return { select: () => ({ eq }) };
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: 'u1', subscription_tier: profile_tier, is_admin: false },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    rpcMock.mockImplementation((name: string) => {
      if (name === 'get_exercise_gif_url')
        return Promise.resolve({ data: 'https://gif', error: null });
      if (name === 'get_exercise_video_url')
        return Promise.resolve({ data: 'https://video', error: null });
      return Promise.resolve({ data: null, error: null });
    });
  }

  it('рендерит exercise с GIF и видео для pro юзера', async () => {
    setupExercise('basic', 'pro');
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ExerciseScreen />, { wrapper: Wrapper });
    await findByText('Squat');
  });

  it('показывает paywall если tier недостаточен', async () => {
    setupExercise('pro', 'free');
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ExerciseScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText(/PRO/i)).toBeTruthy();
    });
  });
});
