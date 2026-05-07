import { Image, Pressable, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Tier } from '@/features/exercises/lib/tierGate';
import { DifficultyDots } from './DifficultyDots';
import { TierBadge } from './TierBadge';

export type ProgramCardData = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  weeks: number;
  sessions_per_week: number;
  difficulty: number;
  min_tier: Tier;
};

export function ProgramCard({
  program,
  onPress,
}: {
  program: ProgramCardData;
  onPress: (slug: string) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onPress(program.slug)}
      accessibilityRole="button"
      accessibilityLabel={program.title}
    >
      <Card variant="glass">
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              height: 140,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {program.cover_url && (
              <Image
                source={{ uri: program.cover_url }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>
          <Text variant="titleLg" weight="semibold">
            {program.title}
          </Text>
          {program.description && (
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {program.description}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.sm,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Text variant="caption" color="textMuted">
              {program.weeks} нед · {program.sessions_per_week} раз/нед
            </Text>
            <DifficultyDots level={program.difficulty} />
            {program.min_tier !== 'free' && <TierBadge tier={program.min_tier} />}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
