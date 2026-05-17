import { render } from '@testing-library/react-native';

import { AppIcon } from './AppIcon';

describe('AppIcon', () => {
  it('рендерится с дефолтными props', () => {
    const { getByTestId } = render(<AppIcon testID="icon" />);
    expect(getByTestId('icon')).toBeTruthy();
  });

  it('принимает кастомный size и radius', () => {
    const { getByTestId } = render(<AppIcon size={64} radius={16} testID="icon" />);
    expect(getByTestId('icon')).toBeTruthy();
  });
});
