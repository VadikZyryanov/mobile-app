import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { TIER_NAMES, TIER_FEATURES } from '@/features/subscription/lib/tierFeatures';
import { TierBadge } from './TierBadge';
import { useTheme } from '@/theme';
import type { Tier, PurchasesPackage } from '@/features/subscription/types';

type Props = {
  tier: Tier;
  priceString: string;
  pkg: PurchasesPackage;
  isCurrentTier?: boolean;
  isRecommended?: boolean;
  onSelect: (pkg: PurchasesPackage) => void;
};

export function PlanCard({
  tier,
  priceString,
  pkg,
  isCurrentTier,
  isRecommended,
  onSelect,
}: Props) {
  const theme = useTheme();
  const features = TIER_FEATURES[tier];

  return (
    <Card
      variant="glass"
      style={isRecommended ? { borderColor: theme.colors.accent, borderWidth: 1.5 } : undefined}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <TierBadge tier={tier} />
          {isRecommended && (
            <Text variant="caption" weight="bold" style={{ color: theme.colors.accent }}>
              Популярный
            </Text>
          )}
        </View>

        <Text variant="titleLg" weight="bold">
          {TIER_NAMES[tier]}
        </Text>

        <Text variant="body" color="textMuted">
          {priceString} / мес
        </Text>

        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
          {features.map((feature) => (
            <Text key={feature} variant="body" color="textMuted">
              {'✓ '}
              {feature}
            </Text>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label={isCurrentTier ? 'Текущий план' : 'Выбрать'}
            variant={isRecommended ? 'primary' : 'secondary'}
            size="md"
            disabled={isCurrentTier}
            onPress={() => onSelect(pkg)}
          />
        </View>
      </View>
    </Card>
  );
}
