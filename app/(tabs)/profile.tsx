import { View } from 'react-native';

import { TierBadge } from '@/components/shared';
import { Button, Card, Screen, Text } from '@/components/ui';
import { useProfile } from '@/features/auth/hooks/useProfile';
import type { Tier } from '@/features/exercises/lib/tierGate';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const email = useAuthStore((s) => s.user?.email);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: profile } = useProfile();
  const tier = ((profile?.subscription_tier as Tier | undefined) ?? 'free') as Tier;

  return (
    <Screen scroll padded>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <Text variant="hero" weight="bold">
          Профиль
        </Text>

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

        <Card variant="glass">
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="titleLg" weight="semibold">
              Подписка
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="bodyLg" color="textMuted">
                Текущий тариф
              </Text>
              <TierBadge tier={tier} />
            </View>
            {tier === 'free' && (
              <Text variant="caption" color="textMuted">
                Управление подпиской появится в следующей версии
              </Text>
            )}
          </View>
        </Card>

        <Button label="Выйти" variant="secondary" fullWidth onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}
