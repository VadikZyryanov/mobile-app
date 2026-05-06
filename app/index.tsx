import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { storage, StorageKeys } from '@/lib/storage';
import { useAuthStore } from '@/store/auth.store';

type Target = '/(tabs)/home' | '/(auth)/onboarding' | '/(auth)/welcome';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      setTarget('/(tabs)/home');
    } else if (status === 'unauthenticated') {
      void storage.get(StorageKeys.onboardingCompleted).then((seen) => {
        setTarget(seen === 'true' ? '/(auth)/onboarding' : '/(auth)/welcome');
      });
    }
  }, [status]);

  if (!target) return null;
  return <Redirect href={target as Href} />;
}
