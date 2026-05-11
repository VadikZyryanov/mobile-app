import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Screen, Text, Button } from '@/components/ui';
import { FoodPickerSheet, QuantityStepper } from '@/components/shared';
import { useFoods, useCreateEntry } from '@/features/nutrition/hooks';
import { useAuthStore } from '@/store/auth.store';
import { scaleNutrients } from '@/features/nutrition/lib/nutritionMath';
import { useTheme } from '@/theme';
import type { Food, MealType } from '@/features/nutrition/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function AddEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { meal, date } = useLocalSearchParams<{ meal: MealType; date: string }>();
  const userId = useAuthStore((s) => s.user?.id);

  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);

  const debouncedQuery = useDebouncedValue(query, 250);
  const { data: foods = [], isLoading } = useFoods(debouncedQuery || undefined);
  const createEntry = useCreateEntry(date ?? '');

  const preview = selectedFood ? scaleNutrients(selectedFood, grams) : null;

  const handleSubmit = () => {
    if (!selectedFood || !userId || !date || !meal) return;
    createEntry.mutate(
      {
        userId,
        foodId: selectedFood.id,
        mealType: meal,
        quantityGrams: grams,
        consumedOn: date,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen padded>
      <View style={{ flex: 1, gap: theme.spacing.lg }}>
        <Text variant="titleLg" weight="bold">
          Добавить продукт
        </Text>

        {!selectedFood ? (
          <FoodPickerSheet
            query={query}
            onQueryChange={setQuery}
            foods={foods}
            isLoading={isLoading}
            onSelect={(food) => {
              setSelectedFood(food);
              setGrams(100);
            }}
          />
        ) : (
          <View style={{ gap: theme.spacing.lg, flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="bodyLg" weight="semibold" style={{ flex: 1 }}>
                {selectedFood.name}
              </Text>
              <Button
                label="Изменить"
                variant="ghost"
                size="sm"
                onPress={() => setSelectedFood(null)}
              />
            </View>

            <QuantityStepper value={grams} onChange={setGrams} />

            {preview && (
              <View
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.radii.lg,
                  backgroundColor: theme.colors.bgElevated,
                  gap: theme.spacing.xs,
                }}
              >
                <Text variant="caption" color="textMuted" weight="medium">
                  Итого
                </Text>
                <Text variant="bodyLg" weight="bold">
                  {Math.round(preview.kcal)} ккал
                </Text>
                <Text variant="caption" color="textMuted">
                  Б {Math.round(preview.protein_g)} · Ж {Math.round(preview.fat_g)} · У{' '}
                  {Math.round(preview.carbs_g)}
                </Text>
              </View>
            )}

            <View style={{ marginTop: 'auto' }}>
              <Button
                label={createEntry.isPending ? 'Сохранение...' : 'Добавить'}
                variant="primary"
                size="lg"
                onPress={handleSubmit}
              />
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
