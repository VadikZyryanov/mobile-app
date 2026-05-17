import { renderWithTheme } from '@/test-utils/render';
import { Badge } from './Badge';

describe('Badge', () => {
  it('рендерит label', () => {
    const { getByText } = renderWithTheme(<Badge variant="pink" label="NEW" />);
    expect(getByText('NEW')).toBeTruthy();
  });

  it('variant="pro" использует дефолтный текст PRO', () => {
    const { getByText } = renderWithTheme(<Badge variant="pro" />);
    expect(getByText('PRO')).toBeTruthy();
  });

  it('variant="dot" не рендерит текст', () => {
    const { queryByText } = renderWithTheme(<Badge variant="dot" label="hidden" />);
    expect(queryByText('hidden')).toBeNull();
  });
});
