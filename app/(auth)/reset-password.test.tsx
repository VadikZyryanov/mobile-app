import { fireEvent, waitFor } from '@testing-library/react-native';

import * as updateModule from '@/features/auth/api/updatePassword';
import { renderWithTheme } from '@/test-utils/render';
import ResetPasswordScreen from './reset-password';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
import { router } from 'expo-router';

describe('ResetPasswordScreen', () => {
  beforeEach(() => (router.replace as jest.Mock).mockReset());

  it('требует совпадения пароля и подтверждения', async () => {
    const spy = jest.spyOn(updateModule, 'updatePassword');
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(
      <ResetPasswordScreen />,
    );
    fireEvent.changeText(getByPlaceholderText('Новый пароль'), 'pw12345678');
    fireEvent.changeText(getByPlaceholderText('Повтори пароль'), 'different');
    fireEvent.press(getByText('Сохранить'));
    expect(await findByText('Пароли не совпадают')).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('при совпадении вызывает updatePassword и redirect на tabs', async () => {
    const spy = jest.spyOn(updateModule, 'updatePassword').mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Новый пароль'), 'pw12345678');
    fireEvent.changeText(getByPlaceholderText('Повтори пароль'), 'pw12345678');
    fireEvent.press(getByText('Сохранить'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('pw12345678'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });
});
