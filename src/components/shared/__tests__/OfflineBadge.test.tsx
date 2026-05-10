import { act, render } from '@testing-library/react-native';

import { mediaCache } from '@/lib/mediaCache';
import { ThemeProvider } from '@/theme';
import { OfflineBadge } from '../OfflineBadge';

beforeEach(async () => {
  jest.clearAllMocks();
  await mediaCache.clearAll();
  await mediaCache.init();
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('OfflineBadge', () => {
  it('renders nothing when media not cached', () => {
    const { queryByText } = render(<OfflineBadge slug="squat" type="gif" />, { wrapper });
    expect(queryByText('Офлайн')).toBeNull();
  });

  it('renders badge when media is cached', async () => {
    await act(async () => {
      await mediaCache.download('squat', 'gif', 'https://example.com/squat.gif');
    });

    const { getByText } = render(<OfflineBadge slug="squat" type="gif" />, { wrapper });
    expect(getByText('Офлайн')).toBeTruthy();
  });
});
