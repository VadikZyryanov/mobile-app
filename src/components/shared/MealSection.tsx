import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { FoodEntryRow } from './FoodEntryRow';
import { scaleNutrients, sumMacros } from '@/features/nutrition/lib/nutritionMath';
import { MEAL_LABELS } from '@/features/nutrition/lib/mealLabels';
import type { NutritionEntryWithFood, MealType } from '@/features/nutrition/types';

interface Props {
  mealType: MealType;
  entries: NutritionEntryWithFood[];
  onAdd: (mealType: MealType) => void;
  onDelete: (id: string) => void;
}

export function MealSection({ mealType, entries, onAdd, onDelete }: Props) {
  const theme = useTheme();
  const totalKcal = Math.round(
    sumMacros(entries.map((e) => scaleNutrients(e.food, Number(e.quantity_grams)))).kcal,
  );

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.base,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Text variant="bodyLg" weight="semibold">
            {MEAL_LABELS[mealType]}
          </Text>
          {entries.length > 0 && (
            <Text variant="caption" color="textMuted">
              {totalKcal} ккал
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => onAdd(mealType)}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.accent,
          }}
        >
          <Text variant="bodyLg" weight="bold" style={{ color: '#fff', lineHeight: 20 }}>
            +
          </Text>
        </Pressable>
      </View>
      {entries.map((entry) => (
        <FoodEntryRow key={entry.id} entry={entry} onDelete={onDelete} />
      ))}
      {entries.length === 0 && (
        <Pressable
          onPress={() => onAdd(mealType)}
          style={{ paddingHorizontal: theme.spacing.base, paddingBottom: theme.spacing.sm }}
        >
          <Text variant="caption" color="textMuted">
            Нажмите +, чтобы добавить продукт
          </Text>
        </Pressable>
      )}
    </View>
  );
}
