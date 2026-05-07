import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import ProgramsList from './index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('ProgramsList', () => {
  beforeEach(() => fromMock.mockReset());

  it('рендерит', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: '1',
          slug: '8w',
          title: '8 недель',
          description: 'd',
          cover_path: 'c.jpg',
          weeks: 8,
          sessions_per_week: 3,
          difficulty: 3,
          min_tier: 'pro',
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ProgramsList />, { wrapper: Wrapper });
    await waitFor(async () => expect(await findByText('8 недель')).toBeTruthy());
  });
});
