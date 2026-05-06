import { fireEvent, waitFor } from '@testing-library/react-native';

import { storage, StorageKeys } from '@/lib/storage';
import { renderWithTheme } from '@/test-utils/render';
import WelcomeScreen from './welcome';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
import { router } from 'expo-router';

describe('WelcomeScreen', () => {
  beforeEach(async () => {
    (router.replace as jest.Mock).mockReset();
    await storage.clearAll();
  });

  it('рендерит первый слайд', () => {
    const { getByText } = renderWithTheme(<WelcomeScreen />);
    expect(getByText('Тренировки на каждый день')).toBeTruthy();
  });

  it('кнопка "Пропустить" пишет флаг и переходит на onboarding', async () => {
    const { getByText } = renderWithTheme(<WelcomeScreen />);
    fireEvent.press(getByText('Пропустить'));
    await waitFor(async () => {
      const v = await storage.get(StorageKeys.onboardingCompleted);
      expect(v).toBe('true');
    });
    expect(router.replace).toHaveBeenCalledWith('/(auth)/onboarding');
  });
});
