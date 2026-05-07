import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';

import { QueryView, TierBadge } from '@/components/shared';
import { Card, Input, Screen, Segmented, Text } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearch } from '@/features/search/hooks';
import type { SearchKind, SearchResult } from '@/features/search/types';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

const KIND_OPTIONS: Array<{ value: SearchKind | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'exercise', label: 'Упражнения' },
  { value: 'workout', label: 'Тренировки' },
];

function ResultRow({
  item,
  onPress,
}: {
  item: SearchResult;
  onPress: (item: SearchResult) => void;
}) {
  const theme = useTheme();
  const cover = item.kind === 'workout' ? getPublicUrl('workout-covers', item.cover_path) : null;

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Card variant="glass">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: theme.radii.md,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {cover && <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyLg" weight="semibold">
              {item.title}
            </Text>
            <Text variant="caption" color="textMuted">
              {item.subtitle}
            </Text>
          </View>
          {item.min_tier !== 'free' && <TierBadge tier={item.min_tier} />}
        </View>
      </Card>
    </Pressable>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<SearchKind | 'all'>('all');
  const debounced = useDebouncedValue(text, 250);
  const q = useSearch(debounced);

  const items = useMemo(
    () => (q.data ?? []).filter((r) => kind === 'all' || r.kind === kind),
    [q.data, kind],
  );

  const onResultPress = (item: SearchResult) => {
    if (item.kind === 'exercise') router.push(`/(tabs)/exercises/${item.slug}` as never);
    else router.push(`/(tabs)/workouts/${item.slug}` as never);
  };

  const showEmpty = debounced.trim().length >= 2 && items.length === 0 && !q.isLoading;

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
          Поиск
        </Text>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Поиск по тренировкам и упражнениям"
        />
        <Segmented
          value={kind}
          options={KIND_OPTIONS}
          onChange={(v) => setKind(v as typeof kind)}
        />
      </View>
      <QueryView
        isLoading={q.isLoading && q.fetchStatus !== 'idle'}
        isError={q.isError}
        isEmpty={showEmpty}
        emptyText="Ничего не нашлось"
        onRetry={() => q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => `${it.kind}-${it.id}`}
          renderItem={({ item }) => <ResultRow item={item} onPress={onResultPress} />}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['3xl'],
            gap: theme.spacing.md,
          }}
        />
      </QueryView>
    </Screen>
  );
}
