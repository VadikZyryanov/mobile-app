import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('рендерит заголовок', () => {
    const { getByText } = renderWithTheme(<TopBar title="Профиль" />);
    expect(getByText('Профиль')).toBeTruthy();
  });

  it('вызывает onLeadingPress при тапе на back', () => {
    const onLeadingPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <TopBar title="Назад" leading="back" onLeadingPress={onLeadingPress} />,
    );
    fireEvent.press(getByLabelText('Назад'));
    expect(onLeadingPress).toHaveBeenCalledTimes(1);
  });

  it('рендерит close-вариант с правильным a11y-лейблом', () => {
    const { getByLabelText } = renderWithTheme(<TopBar leading="close" />);
    expect(getByLabelText('Закрыть')).toBeTruthy();
  });
});
