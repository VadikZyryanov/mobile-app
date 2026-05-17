import { renderWithTheme } from '@/test-utils/render';
import { Notification } from './Notification';

describe('Notification', () => {
  it('рендерит title и message', () => {
    const { getByText } = renderWithTheme(
      <Notification variant="success" title="Готово" message="Подписка активирована" />,
    );
    expect(getByText('Готово')).toBeTruthy();
    expect(getByText('Подписка активирована')).toBeTruthy();
  });

  it('рендерит только message без title', () => {
    const { getByText, queryByText } = renderWithTheme(
      <Notification variant="error" message="Сетевая ошибка" />,
    );
    expect(getByText('Сетевая ошибка')).toBeTruthy();
    expect(queryByText('Готово')).toBeNull();
  });
});
