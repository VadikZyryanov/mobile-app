import { Pressable, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { MacroProgressBar } from './MacroProgressBar';
import type { Macros } from '@/features/nutrition/lib/nutritionMath';
import type { Targets } from '@/features/nutrition/lib/computeTargets';

interface Props {
  total: Macros;
  targets: Targets | null;
  compact?: boolean;
  onPress?: () => void;
}

export function DailyNutritionSummary({ total, targets, compact = false, onPress }: Props) {
  const theme = useTheme();
  const kcalTarget = targets?.kcal ?? 0;

  const content = (
    <Card variant="glass">
      <View style={{ gap: theme.spacing.md }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Text variant="bodyLg" weight="semibold">
            Питание сегодня
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text variant="titleLg" weight="bold">
              {Math.round(total.kcal)}
            </Text>
            {kcalTarget > 0 && (
              <Text variant="caption" color="textMuted">
                /{Math.round(kcalTarget)} ккал
              </Text>
            )}
          </View>
        </View>

        {kcalTarget > 0 && (
          <MacroProgressBar
            label="Калории"
            consumed={total.kcal}
            target={kcalTarget}
            unit=" ккал"
          />
        )}

        {!compact && (
          <View style={{ gap: theme.spacing.sm }}>
            <MacroProgressBar
              label="Белки"
              consumed={total.protein_g}
              target={targets?.protein_g ?? 0}
            />
            <MacroProgressBar label="Жиры" consumed={total.fat_g} target={targets?.fat_g ?? 0} />
            <MacroProgressBar
              label="Углеводы"
              consumed={total.carbs_g}
              target={targets?.carbs_g ?? 0}
            />
          </View>
        )}

        {compact && onPress && (
          <Text variant="caption" color="textMuted" style={{ color: theme.colors.accent }}>
            Открыть дневник →
          </Text>
        )}
      </View>
    </Card>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
