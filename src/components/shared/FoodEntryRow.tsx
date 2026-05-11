import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { scaleNutrients } from '@/features/nutrition/lib/nutritionMath';
import type { NutritionEntryWithFood } from '@/features/nutrition/types';

interface Props {
  entry: NutritionEntryWithFood;
  onDelete?: (id: string) => void;
}

export function FoodEntryRow({ entry, onDelete }: Props) {
  const theme = useTheme();
  const macros = scaleNutrients(entry.food, Number(entry.quantity_grams));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.base,
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {entry.food.name}
        </Text>
        <Text variant="caption" color="textMuted">
          {Math.round(Number(entry.quantity_grams))} г · {Math.round(macros.protein_g)}б{' '}
          {Math.round(macros.fat_g)}ж {Math.round(macros.carbs_g)}у
        </Text>
      </View>
      <Text variant="body" weight="semibold">
        {Math.round(macros.kcal)} ккал
      </Text>
      {onDelete && (
        <Pressable
          onPress={() => onDelete(entry.id)}
          hitSlop={12}
          style={{
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.bgElevated,
          }}
        >
          <Text variant="caption" style={{ color: theme.colors.danger }}>
            ✕
          </Text>
        </Pressable>
      )}
    </View>
  );
}
