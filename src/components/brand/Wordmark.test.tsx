import { render } from '@testing-library/react-native';

import { Wordmark } from './Wordmark';

describe('Wordmark', () => {
  it('stacked: показывает KNYAZEVA и TEAM', () => {
    const { getByText } = render(<Wordmark variant="stacked" />);
    expect(getByText('KNYAZEVA')).toBeTruthy();
    expect(getByText('TEAM')).toBeTruthy();
  });

  it('inline: показывает knyazeva.team', () => {
    const { getByText } = render(<Wordmark variant="inline" testID="wm" />);
    expect(getByText(/knyazeva/)).toBeTruthy();
    expect(getByText(/team/)).toBeTruthy();
  });

  it('принимает разные size без падений', () => {
    const { getByTestId } = render(<Wordmark size="lg" testID="wm" />);
    expect(getByTestId('wm')).toBeTruthy();
  });
});
