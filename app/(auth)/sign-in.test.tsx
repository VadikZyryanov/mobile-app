import { fireEvent, waitFor } from '@testing-library/react-native';

import * as signInWithEmailModule from '@/features/auth/api/signInWithEmail';
import * as signInWithPhoneModule from '@/features/auth/api/signInWithPhone';
import { renderWithTheme } from '@/test-utils/render';
import SignInScreen from './sign-in';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));
import { router } from 'expo-router';

describe('SignInScreen', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockReset();
    jest.restoreAllMocks();
  });

  it('по умолчанию показывает Email-форму', () => {
    const { getByText, queryByText } = renderWithTheme(<SignInScreen />);
    expect(getByText('Войти')).toBeTruthy();
    expect(queryByText('Получить код')).toBeNull();
  });

  it('вызывает signInWithEmail при отправке', async () => {
    const spy = jest
      .spyOn(signInWithEmailModule, 'signInWithEmail')
      .mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'pw12345678');
    fireEvent.press(getByText('Войти'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('a@b.c', 'pw12345678'));
  });

  it('показывает ошибку при провале', async () => {
    jest.spyOn(signInWithEmailModule, 'signInWithEmail').mockResolvedValueOnce({
      ok: false,
      error: 'Неверный email или пароль',
    });
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrong');
    fireEvent.press(getByText('Войти'));
    expect(await findByText('Неверный email или пароль')).toBeTruthy();
  });

  it('переключение на Телефон + отправка вызывает signInWithPhone и push на verify-otp', async () => {
    const spy = jest
      .spyOn(signInWithPhoneModule, 'signInWithPhone')
      .mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<SignInScreen />);
    fireEvent.press(getByText('Телефон'));
    fireEvent.changeText(getByPlaceholderText('+79991234567'), '+79991234567');
    fireEvent.press(getByText('Получить код'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('+79991234567'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(auth)/verify-otp',
      params: { phone: '+79991234567' },
    });
  });
});
