import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { DifficultyDots, QueryView, TierBadge } from '@/components/shared';
import { useProgramDetail } from '@/features/programs/hooks';
import type { ProgramDetail as ProgramDetailT } from '@/features/programs/types';
import type { Tier } from '@/features/exercises/lib/tierGate';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

const BACK_BUTTON_TOP = 56;
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function groupByWeek(schedule: ProgramDetailT['schedule']) {
  const map = new Map<number, ProgramDetailT['schedule']>();
  for (const item of schedule) {
    const arr = map.get(item.week) ?? [];
    arr.push(item);
    map.set(item.week, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a - b);
}

export default function ProgramDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useProgramDetail(slug);
  const cover = getPublicUrl('program-covers', q.data?.cover_path ?? null);
  const weeks = useMemo(() => (q.data ? groupByWeek(q.data.schedule) : []), [q.data]);

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
                    {q.data.weeks} нед · {q.data.sessions_per_week} раз/нед
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
                  Расписание
                </Text>
                {weeks.map(([week, days]) => (
                  <View key={week} style={{ gap: theme.spacing.sm }}>
                    <Text variant="bodyLg" weight="semibold" color="textMuted">
                      Неделя {week}
                    </Text>
                    {days.map((d) => (
                      <Pressable
                        key={`${d.week}-${d.day_of_week}`}
                        accessibilityRole="button"
                        accessibilityLabel={d.workout.title}
                        onPress={() => router.push(`/(tabs)/workouts/${d.workout.slug}` as never)}
                      >
                        <Card variant="glass">
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <Text variant="caption" color="textMuted">
                              {DAY_LABELS[d.day_of_week - 1]}
                            </Text>
                            <Text
                              variant="bodyLg"
                              weight="medium"
                              style={{ flex: 1, marginLeft: theme.spacing.md }}
                            >
                              {d.workout.title}
                            </Text>
                            <Text variant="bodyLg" color="textMuted">
                              ›
                            </Text>
                          </View>
                        </Card>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </>
            )}
          </QueryView>
        </View>
      </ScrollView>
    </Screen>
  );
}
