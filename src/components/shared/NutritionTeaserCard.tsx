import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Targets } from '@/features/nutrition/lib/computeTargets';

type Variant = 'open' | 'locked';

interface Props {
  variant: Variant;
  targets?: Targets | null;
}

export function NutritionTeaserCard({ variant, targets }: Props) {
  const theme = useTheme();
  const router = useRouter();

  if (variant === 'locked') {
    return (
      <Card variant="glass" style={{ borderColor: theme.colors.glassBorder, borderWidth: 1 }}>
        <View
          style={{ gap: theme.spacing.md, alignItems: 'center', paddingVertical: theme.spacing.sm }}
        >
          <Text style={{ fontSize: 32 }}>🥗</Text>
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="bodyLg" weight="semibold" align="center">
              Дневник питания
            </Text>
            <Text variant="caption" color="textMuted" align="center">
              Подсчёт КБЖУ и цели питания доступны в Pro Max
            </Text>
          </View>
          <Button
            label="Открыть Pro Max"
            variant="primary"
            size="sm"
            onPress={() =>
              router.push({ pathname: '/paywall', params: { required: 'pro_max' } } as never)
            }
          />
        </View>
      </Card>
    );
  }

  return (
    <Pressable onPress={() => router.push('/(tabs)/nutrition' as never)}>
      <Card variant="glass" style={{ borderColor: theme.colors.accent, borderWidth: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ gap: 2 }}>
            <Text variant="caption" color="textMuted">
              Питание
            </Text>
            <Text variant="bodyLg" weight="semibold">
              {targets ? `Цель: ${targets.kcal} ккал` : 'Дневник питания'}
            </Text>
          </View>
          <Text variant="caption" style={{ color: theme.colors.accent }}>
            Открыть →
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
