import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Input } from './Input';

describe('Input', () => {
  it('рендерит label, placeholder и hint', () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(
      <Input label="Email" placeholder="you@example.com" hint="Используем для входа" />,
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Используем для входа')).toBeTruthy();
  });

  it('показывает error вместо hint', () => {
    const { getByText, queryByText } = renderWithTheme(
      <Input label="E" placeholder="p" hint="hint text" error="Bad email" />,
    );
    expect(getByText('Bad email')).toBeTruthy();
    expect(queryByText('hint text')).toBeNull();
  });

  it('передаёт onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithTheme(
      <Input placeholder="type" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByPlaceholderText('type'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });
});
