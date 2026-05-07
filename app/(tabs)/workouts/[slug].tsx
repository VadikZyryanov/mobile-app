import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DifficultyDots, ExerciseRow, QueryView, TierBadge } from '@/components/shared';
import { Screen, Text } from '@/components/ui';
import type { Tier } from '@/features/exercises/lib/tierGate';
import { useWorkoutDetail } from '@/features/workouts/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

const BACK_BUTTON_TOP = 56;

export default function WorkoutDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useWorkoutDetail(slug);
  const cover = getPublicUrl('workout-covers', q.data?.cover_path ?? null);

  return (
    <Screen padded={false}>
      <ScrollView>
        <View style={{ height: 320, backgroundColor: theme.colors.bgElevated }}>
          {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Назад"
            style={{
              position: 'absolute',
              top: BACK_BUTTON_TOP,
              left: theme.spacing.lg,
              width: 40,
              height: 40,
              borderRadius: theme.radii.full,
              backgroundColor: theme.colors.glassBg,
              borderWidth: 1,
              borderColor: theme.colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="bodyLg">‹</Text>
          </Pressable>
        </View>

        <View
          style={{
            marginTop: -64,
            backgroundColor: theme.colors.bg,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <QueryView
            isLoading={q.isLoading}
            isError={q.isError}
            isEmpty={false}
            onRetry={() => void q.refetch()}
          >
            {q.data && (
              <>
                <Text variant="heroLg" weight="bold">
                  {q.data.title}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: theme.spacing.md,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Text variant="caption" color="textMuted">
                    {q.data.duration_minutes} мин
                  </Text>
                  <DifficultyDots level={q.data.difficulty} />
                  {q.data.min_tier !== 'free' && <TierBadge tier={q.data.min_tier as Tier} />}
                </View>
                {q.data.description && (
                  <Text variant="bodyLg" color="textMuted">
                    {q.data.description}
                  </Text>
                )}

                <Text variant="titleLg" weight="semibold">
                  Упражнения
                </Text>
                <View>
                  {q.data.exercises.map((row) => (
                    <ExerciseRow
                      key={row.position}
                      row={{
                        position: row.position,
                        exercise_slug: row.exercise.slug,
                        exercise_name: row.exercise.name,
                        sets: row.sets,
                        reps: row.reps,
                        rest_seconds: row.rest_seconds,
                      }}
                      onPress={(s) => router.push(`/(tabs)/exercises/${s}` as never)}
                    />
                  ))}
                </View>
              </>
            )}
          </QueryView>
        </View>
      </ScrollView>
    </Screen>
  );
}
