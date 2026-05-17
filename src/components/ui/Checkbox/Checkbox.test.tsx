import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('переключает состояние при нажатии', () => {
    const onValueChange = jest.fn();
    const { getByRole } = renderWithTheme(
      <Checkbox value={false} onValueChange={onValueChange} accessibilityLabel="agree" />,
    );
    fireEvent.press(getByRole('checkbox'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('показывает чек, когда value=true', () => {
    const { getByText } = renderWithTheme(
      <Checkbox value onValueChange={() => {}} accessibilityLabel="done" />,
    );
    expect(getByText('✓')).toBeTruthy();
  });

  it('не вызывает onValueChange, если disabled', () => {
    const onValueChange = jest.fn();
    const { getByRole } = renderWithTheme(
      <Checkbox value={false} disabled onValueChange={onValueChange} />,
    );
    fireEvent.press(getByRole('checkbox'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
