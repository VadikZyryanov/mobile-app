import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { QueryView } from '@/components/shared';
import { Screen, Text } from '@/components/ui';
import { useBlogPost } from '@/features/blog/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

const BACK_BUTTON_TOP = 56;

function fmt(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
}

export default function BlogPostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useBlogPost(slug);
  const cover = getPublicUrl('blog-media', q.data?.cover_path ?? null);

  const mdStyles = {
    body: { color: theme.colors.text, fontSize: 16, lineHeight: 24 },
    heading1: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '700' as const,
      marginTop: theme.spacing.lg,
    },
    heading2: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '600' as const,
      marginTop: theme.spacing.md,
    },
    paragraph: { color: theme.colors.text, marginTop: theme.spacing.sm },
    list_item: { color: theme.colors.text },
  };

  return (
    <Screen padded={false}>
      <ScrollView>
        <View style={{ height: 280, backgroundColor: theme.colors.bgElevated }}>
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
            gap: theme.spacing.md,
          }}
        >
          <QueryView
            isLoading={q.isLoading}
            isError={q.isError}
            isEmpty={false}
            onRetry={() => q.refetch()}
          >
            {q.data && (
              <>
                <Text variant="caption" color="textMuted">
                  {fmt(q.data.published_at)}
                </Text>
                <Text variant="heroLg" weight="bold">
                  {q.data.title}
                </Text>
                <Markdown style={mdStyles}>{q.data.body}</Markdown>
              </>
            )}
          </QueryView>
        </View>
      </ScrollView>
    </Screen>
  );
}
