import { fireEvent } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { renderWithTheme } from '@/test-utils/render';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('рендерит children и вызывает onPress', () => {
    const onPress = jest.fn();
    const { getByText, getByRole } = renderWithTheme(
      <IconButton variant="pink" onPress={onPress}>
        <RNText>★</RNText>
      </IconButton>,
    );
    expect(getByText('★')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('блокируется при disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(
      <IconButton disabled onPress={onPress}>
        <RNText>x</RNText>
      </IconButton>,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
