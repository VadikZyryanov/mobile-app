jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('expo-file-system/legacy', () => {
  const store: Record<string, string> = {};
  return {
    cacheDirectory: 'file:///cache/',
    getInfoAsync: jest.fn((path: string) => {
      const exists = path in store;
      return Promise.resolve(
        exists
          ? { exists: true, uri: path, size: 100, isDirectory: false, modificationTime: 0 }
          : { exists: false, uri: path, isDirectory: false },
      );
    }),
    makeDirectoryAsync: jest.fn(() => Promise.resolve()),
    downloadAsync: jest.fn((url: string, path: string) => {
      store[path] = url;
      return Promise.resolve({ uri: path, status: 200, headers: {} });
    }),
    deleteAsync: jest.fn((path: string) => {
      if (path.endsWith('/')) {
        for (const key of Object.keys(store)) {
          if (key.startsWith(path)) delete store[key];
        }
      } else {
        delete store[path];
      }
      return Promise.resolve();
    }),
  };
});

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native');
  return { BlurView: View };
});

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => undefined;
  return Reanimated;
});

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' },
  Purchases: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('@/lib/revenuecat', () => ({
  configureRevenueCat: jest.fn(),
  Purchases: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));
