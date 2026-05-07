import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Tier } from '@/features/exercises/lib/tierGate';
import { TIER_LABELS } from '@/features/exercises/lib/tierLabels';

export function TierBadge({ tier }: { tier: Tier }) {
  const theme = useTheme();
  const isPaid = tier !== 'free';
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radii.full,
        backgroundColor: isPaid ? theme.colors.accent : theme.colors.bgElevated,
        borderWidth: isPaid ? 0 : 1,
        borderColor: theme.colors.glassBorder,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        variant="caption"
        weight="bold"
        color={isPaid ? undefined : 'textMuted'}
        style={isPaid ? { color: theme.palette.white } : undefined}
      >
        {TIER_LABELS[tier]}
      </Text>
    </View>
  );
}
