import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui';
import { OfflineBanner } from '@/components/shared';
import { mediaCache } from '@/lib/mediaCache';
import { configureRevenueCat } from '@/lib/revenuecat';
import { queryClient, persistOptions } from '@/services/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { ThemeProvider, useTheme } from '@/theme';

configureRevenueCat();

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
  useEffect(() => {
    void mediaCache.init();
  }, []);

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
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
