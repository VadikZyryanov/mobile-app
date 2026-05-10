import { useSyncExternalStore } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { mediaCache, type MediaType } from '@/lib/mediaCache';
import { useTheme } from '@/theme';

export function OfflineBadge({ slug, type = 'gif' }: { slug: string; type?: MediaType }) {
  const theme = useTheme();

  useSyncExternalStore(mediaCache.subscribe.bind(mediaCache), () => mediaCache.has(slug, type));

  if (!mediaCache.has(slug, type)) return null;

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.bgElevated,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" weight="bold" color="textMuted">
        Офлайн
      </Text>
    </View>
  );
}
