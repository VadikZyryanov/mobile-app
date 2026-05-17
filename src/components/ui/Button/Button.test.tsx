import { fireEvent } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { renderWithTheme } from '@/test-utils/render';
import { palette } from '@/theme';
import { Button } from './Button';

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.filter((s) => s && typeof s === 'object'))
    : ((style as Record<string, unknown>) ?? {});

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

  it('cream-вариант: cream-фон и ink-текст', () => {
    const { getByRole, getByText } = renderWithTheme(<Button variant="cream" label="Cream" />);
    const containerStyle = flattenStyle(getByRole('button').props.style);
    expect(containerStyle.backgroundColor).toBe(palette.cream);
    const labelStyle = flattenStyle(getByText('Cream').props.style);
    expect(labelStyle.color).toBe(palette.ink);
  });

  it('text-вариант: прозрачный фон и pink-текст', () => {
    const { getByRole, getByText } = renderWithTheme(<Button variant="text" label="Link" />);
    const containerStyle = flattenStyle(getByRole('button').props.style);
    expect(containerStyle.backgroundColor).toBe('transparent');
    const labelStyle = flattenStyle(getByText('Link').props.style);
    expect(labelStyle.color).toBe(palette.pink);
  });

  it('size xs использует typography small', () => {
    const { getByText } = renderWithTheme(<Button size="xs" label="Tiny" />);
    const labelStyle = flattenStyle(getByText('Tiny').props.style);
    expect(labelStyle.fontSize).toBe(11);
  });

  it('рендерит iconLeft и iconRight', () => {
    const { getByText } = renderWithTheme(
      <Button label="With icons" iconLeft={<RNText>L</RNText>} iconRight={<RNText>R</RNText>} />,
    );
    expect(getByText('L')).toBeTruthy();
    expect(getByText('R')).toBeTruthy();
  });
});
