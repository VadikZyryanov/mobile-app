import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Button } from './Button';

describe('Button', () => {
  it('рендерит label', () => {
    const { getByText } = renderWithTheme(<Button label="Press me" />);
    expect(getByText('Press me')).toBeTruthy();
  });

  it('вызывает onPress', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(<Button label="Tap" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('не вызывает onPress, если disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(<Button label="Tap" onPress={onPress} disabled />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('показывает индикатор загрузки и блокирует нажатие', () => {
    const onPress = jest.fn();
    const { getByRole, queryByText } = renderWithTheme(
      <Button label="Loading" onPress={onPress} loading />,
    );
    expect(queryByText('Loading')).toBeNull();
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
