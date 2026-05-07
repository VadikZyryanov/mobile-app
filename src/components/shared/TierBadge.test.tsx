import { render } from '@testing-library/react-native';
import { TierBadge } from './TierBadge';

describe('TierBadge', () => {
  it('рендерит метку тарифа', () => {
    const { getByText } = render(<TierBadge tier="pro" />);
    expect(getByText('PRO')).toBeTruthy();
  });
  it('правильно форматирует pro_max', () => {
    const { getByText } = render(<TierBadge tier="pro_max" />);
    expect(getByText('PRO MAX')).toBeTruthy();
  });
  it('free и basic тоже', () => {
    expect(render(<TierBadge tier="free" />).getByText('FREE')).toBeTruthy();
    expect(render(<TierBadge tier="basic" />).getByText('BASIC')).toBeTruthy();
  });
});
