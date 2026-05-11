import { useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import {
  BlogPostCard,
  DailyNutritionSummary,
  ProgramCard,
  QueryView,
  WorkoutCard,
  type BlogPostCardData,
  type ProgramCardData,
  type WorkoutCardData,
} from '@/components/shared';
import { Card, Screen, Text } from '@/components/ui';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useBlogPosts } from '@/features/blog/hooks';
import { usePrograms } from '@/features/programs/hooks';
import { hasAccess, type Tier } from '@/features/exercises/lib/tierGate';
import { useSubscriptionSummary } from '@/features/subscription/hooks/useSubscriptionSummary';
import { useDailyEntries, useDailySummary, useNutritionTargets } from '@/features/nutrition/hooks';
import { useWorkouts } from '@/features/workouts/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const { data: summary } = useSubscriptionSummary();
  const workouts = useWorkouts();
  const programs = usePrograms();
  const posts = useBlogPosts();

  const userTier = (summary?.tier ?? profile.data?.subscription_tier ?? 'free') as Tier;
  const isFree = userTier === 'free';
  const isProMax = hasAccess(userTier, 'pro_max');

  const todayStr = new Date().toISOString().slice(0, 10);
  const nutritionTargets = useNutritionTargets(profile.data ?? undefined);
  const { data: todayEntries = [] } = useDailyEntries(profile.data?.id, todayStr);
  const nutritionSummary = useDailySummary(todayEntries, nutritionTargets);

  function navigateWithTierCheck(path: string, minTier: Tier) {
    if (!hasAccess(userTier, minTier)) {
      router.push({ pathname: '/paywall', params: { required: minTier } } as never);
    } else {
      router.push(path as never);
    }
  }

  const wItems: WorkoutCardData[] = (workouts.data ?? []).slice(0, 5).map((w) => ({
    slug: w.slug,
    title: w.title,
    category: w.category,
    cover_url: getPublicUrl('workout-covers', w.cover_path),
    duration_minutes: w.duration_minutes,
    difficulty: w.difficulty,
    min_tier: w.min_tier,
  }));

  const pItems: ProgramCardData[] = (programs.data ?? []).slice(0, 3).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    cover_url: getPublicUrl('program-covers', p.cover_path),
    weeks: p.weeks,
    sessions_per_week: p.sessions_per_week,
    difficulty: p.difficulty,
    min_tier: p.min_tier,
  }));

  const bItems: BlogPostCardData[] = (posts.data ?? []).slice(0, 5).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover_url: getPublicUrl('blog-media', p.cover_path),
    published_at: p.published_at,
  }));

  const isLoading = workouts.isLoading || programs.isLoading || posts.isLoading;
  const isError = workouts.isError || programs.isError || posts.isError;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing['3xl'], gap: theme.spacing['2xl'] }}
      >
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.xl,
            gap: theme.spacing.xs,
          }}
        >
          <Text variant="caption" color="textMuted">
            Привет
          </Text>
          <Text variant="heroLg" weight="bold">
            {profile.data?.display_name ?? '👋'}
          </Text>
        </View>

        {isFree && (
          <View style={{ paddingHorizontal: theme.spacing.lg }}>
            <Pressable onPress={() => router.push('/paywall' as never)}>
              <Card variant="glass" style={{ borderColor: theme.colors.accent, borderWidth: 1 }}>
                <View style={{ gap: theme.spacing.xs }}>
                  <Text variant="bodyLg" weight="semibold">
                    Открой все тренировки
                  </Text>
                  <Text variant="caption" color="textMuted">
                    Получи доступ к программам, видео техники и индивидуальному плану →
                  </Text>
                </View>
              </Card>
            </Pressable>
          </View>
        )}

        {isProMax && (
          <View style={{ paddingHorizontal: theme.spacing.lg }}>
            <DailyNutritionSummary
              total={nutritionSummary.total}
              targets={nutritionTargets}
              compact
              onPress={() => router.push('/(tabs)/nutrition' as never)}
            />
          </View>
        )}

        <QueryView
          isLoading={isLoading}
          isError={isError}
          isEmpty={false}
          onRetry={() => {
            void workouts.refetch();
            void programs.refetch();
            void posts.refetch();
          }}
        >
          <View style={{ gap: theme.spacing['2xl'] }}>
            <View style={{ gap: theme.spacing.md }}>
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <Text variant="titleLg" weight="semibold">
                  Рекомендуемые
                </Text>
              </View>
              <FlatList
                horizontal
                data={wItems}
                keyExtractor={(it) => it.slug}
                renderItem={({ item }) => (
                  <View style={{ width: 320 }}>
                    <WorkoutCard
                      workout={item}
                      onPress={(slug) =>
                        navigateWithTierCheck(`/(tabs)/workouts/${slug}`, item.min_tier)
                      }
                    />
                  </View>
                )}
                contentContainerStyle={{
                  paddingHorizontal: theme.spacing.lg,
                  gap: theme.spacing.md,
                }}
                showsHorizontalScrollIndicator={false}
              />
            </View>

            <View style={{ gap: theme.spacing.md }}>
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <Text variant="titleLg" weight="semibold">
                  Программы
                </Text>
              </View>
              <FlatList
                horizontal
                data={pItems}
                keyExtractor={(it) => it.slug}
                renderItem={({ item }) => (
                  <View style={{ width: 280 }}>
                    <ProgramCard
                      program={item}
                      onPress={(slug) =>
                        navigateWithTierCheck(`/(tabs)/programs/${slug}`, item.min_tier)
                      }
                    />
                  </View>
                )}
                contentContainerStyle={{
                  paddingHorizontal: theme.spacing.lg,
                  gap: theme.spacing.md,
                }}
                showsHorizontalScrollIndicator={false}
              />
            </View>

            <View style={{ gap: theme.spacing.md }}>
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <Text variant="titleLg" weight="semibold">
                  Из блога
                </Text>
              </View>
              <FlatList
                horizontal
                data={bItems}
                keyExtractor={(it) => it.slug}
                renderItem={({ item }) => (
                  <View style={{ width: 280 }}>
                    <BlogPostCard
                      post={item}
                      onPress={(slug) => router.push(`/(tabs)/blog/${slug}` as never)}
                    />
                  </View>
                )}
                contentContainerStyle={{
                  paddingHorizontal: theme.spacing.lg,
                  gap: theme.spacing.md,
                }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>
        </QueryView>
      </ScrollView>
    </Screen>
  );
}
