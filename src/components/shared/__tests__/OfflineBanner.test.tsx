import { render } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { OfflineBanner } from '../OfflineBanner';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('OfflineBanner', () => {
  it('renders without crashing when online', () => {
    const { queryByText } = render(<OfflineBanner />, { wrapper });
    expect(queryByText('Нет соединения · показываю сохранённое')).toBeTruthy();
  });
});
