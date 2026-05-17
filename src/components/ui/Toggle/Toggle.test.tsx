import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('переключает значение при нажатии', () => {
    const onValueChange = jest.fn();
    const { getByRole } = renderWithTheme(
      <Toggle value={false} onValueChange={onValueChange} accessibilityLabel="push" />,
    );
    fireEvent.press(getByRole('switch'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('не вызывает onValueChange, если disabled', () => {
    const onValueChange = jest.fn();
    const { getByRole } = renderWithTheme(
      <Toggle value onValueChange={onValueChange} disabled accessibilityLabel="locked" />,
    );
    fireEvent.press(getByRole('switch'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
