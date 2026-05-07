import { fireEvent, render } from '@testing-library/react-native';
import { PaywallCard } from './PaywallCard';

describe('PaywallCard', () => {
  it('показывает требуемый тариф', () => {
    const { getByText } = render(<PaywallCard requiredTier="pro" />);
    expect(getByText(/PRO/)).toBeTruthy();
  });
  it('вызывает onLearnMore при тапе на кнопку', () => {
    const fn = jest.fn();
    const { getByText } = render(<PaywallCard requiredTier="basic" onLearnMore={fn} />);
    fireEvent.press(getByText('Подробнее'));
    expect(fn).toHaveBeenCalled();
  });
});
