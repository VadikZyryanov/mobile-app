import { fireEvent, waitFor } from '@testing-library/react-native';

import * as resetModule from '@/features/auth/api/resetPassword';
import { renderWithTheme } from '@/test-utils/render';
import ForgotPasswordScreen from './forgot-password';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

describe('ForgotPasswordScreen', () => {
  it('вызывает resetPassword и показывает экран подтверждения', async () => {
    const spy = jest.spyOn(resetModule, 'resetPassword').mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.press(getByText('Отправить ссылку'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('a@b.c'));
    expect(await findByText(/Письмо отправлено/)).toBeTruthy();
  });
});
