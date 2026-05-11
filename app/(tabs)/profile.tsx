import { Alert, View } from 'react-native';
import { useSyncExternalStore } from 'react';

import { NutritionTeaserCard, SubscriptionSummaryCard, TierBadge } from '@/components/shared';
import { Button, Card, Screen, Text } from '@/components/ui';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { hasAccess, type Tier } from '@/features/exercises/lib/tierGate';
import { useSubscriptionSummary } from '@/features/subscription/hooks/useSubscriptionSummary';
import { useNutritionTargets } from '@/features/nutrition/hooks';
import { mediaCache } from '@/lib/mediaCache';
import { queryClient, persister } from '@/services/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
}

function useMediaCacheStats() {
  useSyncExternalStore(mediaCache.subscribe.bind(mediaCache), () => mediaCache.totalSize());
  return { size: mediaCache.totalSize(), count: mediaCache.list().length };
}

export default function ProfileScreen() {
  const theme = useTheme();
  const email = useAuthStore((s) => s.user?.email);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: profile } = useProfile();
  const { data: summary } = useSubscriptionSummary();
  const tier = (summary?.tier ??
    (profile?.subscription_tier as Tier | undefined) ??
    'free') as Tier;
  const { size, count } = useMediaCacheStats();
  const isProMax = hasAccess(tier, 'pro_max');
  const nutritionTargets = useNutritionTargets(profile ?? undefined);

  function handleClearMediaCache() {
    Alert.alert('Очистить медиа-кэш', 'Удалить все загруженные видео и GIF?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: () => void mediaCache.clearAll() },
    ]);
  }

  function handleClearAllOffline() {
    Alert.alert('Очистить весь офлайн-кэш', 'Удалить медиа и сохранённые данные запросов?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Очистить',
        style: 'destructive',
        onPress: () => {
          void mediaCache.clearAll();
          void persister.removeClient();
          queryClient.clear();
        },
      },
    ]);
  }

  return (
    <Screen scroll padded>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Профиль
          </Text>
          <TierBadge tier={tier} />
        </View>

        <Card variant="glass">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="caption" color="textMuted">
              Имя
            </Text>
            <Text variant="bodyLg" weight="medium">
              {profile?.display_name ?? '—'}
            </Text>
            <Text variant="caption" color="textMuted">
              Email
            </Text>
            <Text variant="bodyLg">{email ?? '—'}</Text>
          </View>
        </Card>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="titleLg" weight="semibold">
            Подписка
          </Text>
          <SubscriptionSummaryCard />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="titleLg" weight="semibold">
            Питание
          </Text>
          <NutritionTeaserCard variant={isProMax ? 'open' : 'locked'} targets={nutritionTargets} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="titleLg" weight="semibold">
            Хранилище
          </Text>
          <Card variant="glass">
            <View style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" color="textMuted">
                  Медиа-кэш
                </Text>
                <Text variant="body" weight="medium">
                  {formatBytes(size)} · {count} файлов
                </Text>
              </View>
              <Button
                label="Очистить медиа-кэш"
                variant="secondary"
                fullWidth
                onPress={handleClearMediaCache}
              />
              <Button
                label="Очистить весь офлайн-кэш"
                variant="ghost"
                fullWidth
                onPress={handleClearAllOffline}
              />
            </View>
          </Card>
        </View>

        <Button label="Выйти" variant="secondary" fullWidth onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}
