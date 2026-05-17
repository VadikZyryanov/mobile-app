import { fireEvent } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { renderWithTheme } from '@/test-utils/render';
import { FAB } from './FAB';

describe('FAB', () => {
  it('рендерит children', () => {
    const { getByText } = renderWithTheme(
      <FAB onPress={() => {}}>
        <RNText>+</RNText>
      </FAB>,
    );
    expect(getByText('+')).toBeTruthy();
  });

  it('вызывает onPress', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(
      <FAB onPress={onPress}>
        <RNText>+</RNText>
      </FAB>,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
