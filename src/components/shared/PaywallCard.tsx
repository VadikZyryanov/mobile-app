import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Tier } from '@/features/exercises/lib/tierGate';

const TIER_LABEL: Record<Tier, string> = {
  free: 'FREE',
  basic: 'BASIC',
  pro: 'PRO',
  pro_max: 'PRO MAX',
};

type Props = { requiredTier: Tier; onLearnMore?: () => void };

export function PaywallCard({ requiredTier, onLearnMore }: Props) {
  const theme = useTheme();
  return (
    <Card variant="glass">
      <View
        style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.lg }}
      >
        <Text variant="titleLg" weight="bold" align="center">
          Доступно с подпиской {TIER_LABEL[requiredTier]}
        </Text>
        <Text variant="caption" color="textMuted" align="center">
          Откройте полный доступ к видео техники, программам и тренировкам
        </Text>
        <Button label="Подробнее" variant="primary" size="md" onPress={onLearnMore ?? (() => {})} />
      </View>
    </Card>
  );
}
