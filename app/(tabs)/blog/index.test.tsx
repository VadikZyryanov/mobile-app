import { render, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';

import BlogList from './index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('BlogList', () => {
  beforeEach(() => fromMock.mockReset());
  it('рендерит посты', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: '1',
          slug: 'p',
          title: 'Пост',
          excerpt: 'эксцерпт',
          cover_path: 'c.jpg',
          body: '',
          author_id: 'u',
          published_at: '2026-05-01T00:00:00Z',
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ not: () => ({ order }) }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<BlogList />, { wrapper: Wrapper });
    await waitFor(async () => expect(await findByText('Пост')).toBeTruthy());
  });
});
