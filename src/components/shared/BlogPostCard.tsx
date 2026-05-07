import { Image, Pressable, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export type BlogPostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function BlogPostCard({
  post,
  onPress,
}: {
  post: BlogPostCardData;
  onPress: (slug: string) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => onPress(post.slug)}>
      <Card variant="glass">
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              height: 160,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {post.cover_url && (
              <Image source={{ uri: post.cover_url }} style={{ width: '100%', height: '100%' }} />
            )}
          </View>
          <Text variant="caption" color="textMuted">
            {formatDate(post.published_at)}
          </Text>
          <Text variant="titleLg" weight="semibold">
            {post.title}
          </Text>
          {post.excerpt && (
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {post.excerpt}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
