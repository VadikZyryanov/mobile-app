import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  authToken: 'auth.token',
  authUserId: 'auth.userId',
  themeOverride: 'settings.themeOverride',
  onboardingCompleted: 'onboarding.completed',
  rqPersistorBuster: 'rq.persistor.buster',
  mediaCacheIndex: 'media.cache.index.v1',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export const storage = {
  get: (key: StorageKey): Promise<string | null> => AsyncStorage.getItem(key),
  set: (key: StorageKey, value: string): Promise<void> => AsyncStorage.setItem(key, value),
  remove: (key: StorageKey): Promise<void> => AsyncStorage.removeItem(key),
  clearAll: (): Promise<void> => AsyncStorage.clear(),
  getAllKeys: async (): Promise<readonly string[]> => AsyncStorage.getAllKeys(),
  getJSON: async <T>(key: StorageKey): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  setJSON: async <T>(key: StorageKey, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};
