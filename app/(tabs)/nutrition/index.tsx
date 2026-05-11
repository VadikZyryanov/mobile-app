import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Screen, Text, Button } from '@/components/ui';
import { DailyNutritionSummary, MealSection, PaywallCard } from '@/components/shared';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useSubscriptionSummary } from '@/features/subscription/hooks/useSubscriptionSummary';
import { hasAccess, type Tier } from '@/features/exercises/lib/tierGate';
import {
  useDailyEntries,
  useDailySummary,
  useNutritionTargets,
  useDeleteEntry,
} from '@/features/nutrition/hooks';
import { MEAL_ORDER } from '@/features/nutrition/lib/mealLabels';
import { useTheme } from '@/theme';
import { useState } from 'react';
import type { MealType } from '@/features/nutrition/types';

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function NutritionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const { data: summary } = useSubscriptionSummary();

  const userTier = (summary?.tier ?? profile.data?.subscription_tier ?? 'free') as Tier;
  const isProMax = hasAccess(userTier, 'pro_max');

  const [date, setDate] = useState(() => new Date());
  const dateStr = toISODate(date);

  const userId = profile.data?.id;
  const targets = useNutritionTargets(profile.data ?? undefined);
  const { data: entries = [] } = useDailyEntries(userId, dateStr);
  const summary2 = useDailySummary(entries, targets);
  const deleteEntry = useDeleteEntry(dateStr);

  if (!isProMax) {
    return (
      <Screen padded>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <PaywallCard requiredTier="pro_max" />
        </View>
      </Screen>
    );
  }

  const handleAdd = (mealType: MealType) => {
    router.push({
      pathname: '/(tabs)/nutrition/add',
      params: { meal: mealType, date: dateStr },
    } as never);
  };

  const prevDay = () =>
    setDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() - 1);
      return nd;
    });
  const nextDay = () =>
    setDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 1);
      return nd;
    });
  const isToday = toISODate(new Date()) === dateStr;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing['3xl'] }}>
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.xl,
            gap: theme.spacing.xl,
          }}
        >
          {/* Date stepper */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Button label="‹" variant="ghost" size="sm" onPress={prevDay} />
            <Text variant="bodyLg" weight="semibold">
              {isToday
                ? 'Сегодня'
                : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </Text>
            <Button label="›" variant="ghost" size="sm" onPress={nextDay} />
          </View>

          {/* Summary card */}
          <DailyNutritionSummary total={summary2.total} targets={targets} />

          {/* Targets CTA if not set */}
          {!targets && (
            <Button
              label="Задать цели КБЖУ"
              variant="secondary"
              size="md"
              onPress={() => router.push('/(tabs)/nutrition/targets' as never)}
            />
          )}
        </View>

        {/* Meal sections */}
        <View style={{ marginTop: theme.spacing.xl }}>
          {MEAL_ORDER.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={entries.filter((e) => e.meal_type === mealType)}
              onAdd={handleAdd}
              onDelete={(id) => deleteEntry.mutate(id)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
