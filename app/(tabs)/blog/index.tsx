import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';

import { BlogPostCard, QueryView } from '@/components/shared';
import type { BlogPostCardData } from '@/components/shared/BlogPostCard';
import { Screen, Text } from '@/components/ui';
import { useBlogPosts } from '@/features/blog/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

export default function BlogList() {
  const theme = useTheme();
  const router = useRouter();
  const q = useBlogPosts();

  const items: BlogPostCardData[] = (q.data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover_url: getPublicUrl('blog-media', p.cover_path),
    published_at: p.published_at,
  }));

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
        <Text variant="hero" weight="bold">
          Блог
        </Text>
      </View>
      <QueryView
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={items.length === 0}
        emptyText="Пока нет постов"
        onRetry={() => q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => it.slug}
          renderItem={({ item }) => (
            <BlogPostCard
              post={item}
              onPress={(slug) => router.push(`/(tabs)/blog/${slug}` as never)}
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
