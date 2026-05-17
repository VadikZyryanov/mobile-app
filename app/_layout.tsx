import {
  useFonts,
  Manrope_400Regular,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '@/components/brand';
import { Screen } from '@/components/ui';
import { OfflineBanner } from '@/components/shared';
import { mediaCache } from '@/lib/mediaCache';
import { configureRevenueCat } from '@/lib/revenuecat';
import { queryClient, persistOptions } from '@/services/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { ThemeProvider, useTheme } from '@/theme';

configureRevenueCat();
void SplashScreen.preventAutoHideAsync();

const SPLASH_HOLD_MS = 2200;

function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)/home');
    } else if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    }
  }, [status, segments, router]);

  if (status === 'loading') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </Screen>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_600SemiBold,
  });
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    void mediaCache.init();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => setSplashVisible(false), SPLASH_HOLD_MS);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <ThemeProvider>
            <StatusBar style="auto" />
            <OfflineBanner />
            <AuthGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="paywall"
                  options={{ presentation: 'modal', headerShown: false }}
                />
              </Stack>
            </AuthGate>
            <AnimatedSplash visible={splashVisible} />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
