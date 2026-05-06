import { fireEvent, waitFor } from '@testing-library/react-native';

import * as signUpModule from '@/features/auth/api/signUpWithEmail';
import { renderWithTheme } from '@/test-utils/render';
import SignUpScreen from './sign-up';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

describe('SignUpScreen', () => {
  it('вызывает signUpWithEmail с email, password и displayName', async () => {
    const spy = jest.spyOn(signUpModule, 'signUpWithEmail').mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('не менее 8 символов'), 'pw12345678');
    fireEvent.changeText(getByPlaceholderText('Как тебя называть?'), 'Vadim');
    fireEvent.press(getByText('Создать аккаунт'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('a@b.c', 'pw12345678', 'Vadim'));
  });

  it('показывает ошибку', async () => {
    jest.spyOn(signUpModule, 'signUpWithEmail').mockResolvedValueOnce({
      ok: false,
      error: 'Аккаунт с таким email уже существует',
    });
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('не менее 8 символов'), 'pw12345678');
    fireEvent.press(getByText('Создать аккаунт'));
    expect(await findByText('Аккаунт с таким email уже существует')).toBeTruthy();
  });
});
