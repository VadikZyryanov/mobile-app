import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import WorkoutsList from './index';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/services/storage', () => ({
  getPublicUrl: jest.fn(() => null),
}));

const fromMock = supabase.from as jest.Mock;

describe('WorkoutsList screen', () => {
  beforeEach(() => fromMock.mockReset());

  it('рендерит список', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: '1',
          slug: 'upper',
          title: 'Upper Power',
          category: 'upper',
          cover_path: 'c.jpg',
          duration_minutes: 45,
          difficulty: 3,
          min_tier: 'basic',
          description: '',
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });

    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<WorkoutsList />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Upper Power')).toBeTruthy();
    });
  });
});
