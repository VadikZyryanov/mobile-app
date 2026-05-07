import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';

import { ProgramCard, QueryView } from '@/components/shared';
import type { ProgramCardData } from '@/components/shared/ProgramCard';
import { Screen, Text } from '@/components/ui';
import { usePrograms } from '@/features/programs/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

export default function ProgramsList() {
  const theme = useTheme();
  const router = useRouter();
  const q = usePrograms();

  const items: ProgramCardData[] = (q.data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    cover_url: getPublicUrl('program-covers', p.cover_path),
    weeks: p.weeks,
    sessions_per_week: p.sessions_per_week,
    difficulty: p.difficulty,
    min_tier: p.min_tier,
  }));

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
        <Text variant="hero" weight="bold">
          Программы
        </Text>
      </View>
      <QueryView
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={items.length === 0}
        emptyText="Нет программ"
        onRetry={() => q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => it.slug}
          renderItem={({ item }) => (
            <ProgramCard
              program={item}
              onPress={(slug) => router.push(`/(tabs)/programs/${slug}` as never)}
            />
          )}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['3xl'],
            gap: theme.spacing.lg,
          }}
          refreshControl={
            <RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} />
          }
        />
      </QueryView>
    </Screen>
  );
}
