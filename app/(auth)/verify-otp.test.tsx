import { act, fireEvent, waitFor } from '@testing-library/react-native';

import * as verifyModule from '@/features/auth/api/verifyPhoneOtp';
import * as resendModule from '@/features/auth/api/signInWithPhone';
import { renderWithTheme } from '@/test-utils/render';
import VerifyOtpScreen from './verify-otp';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ phone: '+79991234567' }),
}));

describe('VerifyOtpScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('вызывает verifyPhoneOtp с phone и кодом', async () => {
    const spy = jest.spyOn(verifyModule, 'verifyPhoneOtp').mockResolvedValueOnce({ ok: true });
    const { getByText, getByLabelText } = renderWithTheme(<VerifyOtpScreen />);
    fireEvent.changeText(getByLabelText('OTP-input'), '123456');
    fireEvent.press(getByText('Подтвердить'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('+79991234567', '123456'));
  });

  it('кнопка "Отправить ещё раз" вызывает signInWithPhone после окончания cooldown', async () => {
    const spy = jest.spyOn(resendModule, 'signInWithPhone').mockResolvedValueOnce({ ok: true });
    const { getByText } = renderWithTheme(<VerifyOtpScreen />);
    act(() => jest.advanceTimersByTime(60000));
    fireEvent.press(getByText('Отправить ещё раз'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('+79991234567'));
  });
});
