import { Image, Pressable, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Tier } from '@/features/exercises/lib/tierGate';
import { DifficultyDots } from './DifficultyDots';
import { TierBadge } from './TierBadge';

export type WorkoutCardData = {
  slug: string;
  title: string;
  category: string;
  cover_url: string | null;
  duration_minutes: number;
  difficulty: number;
  min_tier: Tier;
};

export function WorkoutCard({
  workout,
  onPress,
}: {
  workout: WorkoutCardData;
  onPress: (slug: string) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => onPress(workout.slug)}>
      <Card variant="glass">
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {workout.cover_url && (
              <Image
                source={{ uri: workout.cover_url }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="bodyLg" weight="semibold">
              {workout.title}
            </Text>
            <Text variant="caption" color="textMuted">
              {workout.category}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: theme.spacing.sm,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Text variant="caption" color="textMuted">
                {workout.duration_minutes} мин
              </Text>
              <DifficultyDots level={workout.difficulty} />
              {workout.min_tier !== 'free' && <TierBadge tier={workout.min_tier} />}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
