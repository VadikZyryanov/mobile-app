import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { QueryView, WorkoutCard } from '@/components/shared';
import type { WorkoutCardData } from '@/components/shared/WorkoutCard';
import { Screen, Segmented, Text } from '@/components/ui';
import { useWorkouts } from '@/features/workouts/hooks';
import type { WorkoutCategory } from '@/features/workouts/types';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

type CategoryFilter = WorkoutCategory | 'all';

const CATEGORIES: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'upper', label: 'Верх' },
  { value: 'lower', label: 'Низ' },
  { value: 'full_body', label: 'Full body' },
  { value: 'cardio', label: 'Кардио' },
  { value: 'core', label: 'Кор' },
];

export default function WorkoutsList() {
  const theme = useTheme();
  const router = useRouter();
  const [cat, setCat] = useState<CategoryFilter>('all');
  const filter = cat === 'all' ? undefined : (cat as WorkoutCategory);
  const q = useWorkouts(filter);

  const items: WorkoutCardData[] = (q.data ?? []).map((w) => ({
    slug: w.slug,
    title: w.title,
    category: w.category,
    cover_url: getPublicUrl('workout-covers', w.cover_path),
    duration_minutes: w.duration_minutes,
    difficulty: w.difficulty,
    min_tier: w.min_tier,
  }));

  return (
    <Screen padded={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
      >
        <Text variant="hero" weight="bold">
          Тренировки
        </Text>
        <Segmented<CategoryFilter> value={cat} options={CATEGORIES} onChange={setCat} />
      </View>
      <QueryView
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={items.length === 0}
        emptyText="Нет тренировок в этой категории"
        onRetry={() => void q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => it.slug}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={(slug) => router.push(`/(tabs)/workouts/${slug}` as never)}
            />
          )}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['3xl'],
            gap: theme.spacing.md,
          }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />
          }
        />
      </QueryView>
    </Screen>
  );
}
