import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  authToken: 'auth.token',
  authUserId: 'auth.userId',
  themeOverride: 'settings.themeOverride',
  onboardingCompleted: 'onboarding.completed',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export const storage = {
  get: (key: StorageKey): Promise<string | null> => AsyncStorage.getItem(key),
  set: (key: StorageKey, value: string): Promise<void> => AsyncStorage.setItem(key, value),
  remove: (key: StorageKey): Promise<void> => AsyncStorage.removeItem(key),
  clearAll: (): Promise<void> => AsyncStorage.clear(),
  getAllKeys: async (): Promise<readonly string[]> => AsyncStorage.getAllKeys(),
};
