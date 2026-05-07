import { render, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';

import BlogPost from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'p' }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));
jest.mock('react-native-markdown-display', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => {
    const { Text: RNText } = jest.requireActual('react-native');
    return <RNText>{children}</RNText>;
  },
}));

const fromMock = supabase.from as jest.Mock;

describe('BlogPost', () => {
  beforeEach(() => fromMock.mockReset());
  it('рендерит', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: '1',
        slug: 'p',
        title: 'Заголовок',
        excerpt: '',
        body: '# Hello',
        cover_path: 'c.jpg',
        author_id: 'u',
        published_at: '2026-05-01T00:00:00Z',
        created_at: '',
        updated_at: '',
      },
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ single }) }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<BlogPost />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Заголовок')).toBeTruthy();
    });
  });
});
