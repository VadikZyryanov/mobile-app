import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let configured = false;

export function configureRevenueCat() {
  if (configured) return;

  const extra = Constants.expoConfig?.extra ?? {};
  const apiKey = Platform.OS === 'ios' ? extra.revenueCatApiKeyIos : extra.revenueCatApiKeyAndroid;

  if (!apiKey) {
    if (__DEV__) {
      console.warn('[RevenueCat] API key not configured — IAP will not work');
      return;
    }
    throw new Error('RevenueCat API key not configured');
  }

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  configured = true;
}

export { Purchases };
