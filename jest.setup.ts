jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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
