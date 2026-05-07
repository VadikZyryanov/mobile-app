import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

export type ExerciseRowData = {
  position: number;
  exercise_slug: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
};

export function ExerciseRow({
  row,
  onPress,
}: {
  row: ExerciseRowData;
  onPress: (slug: string) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onPress(row.exercise_slug)}
      accessibilityRole="button"
      accessibilityLabel={row.exercise_name}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.bgElevated,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="caption" weight="semibold">
            {row.position}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyLg" weight="medium">
            {row.exercise_name}
          </Text>
          <Text variant="caption" color="textMuted">
            {row.sets}×{row.reps} · отдых {row.rest_seconds}с
          </Text>
        </View>
        <Text variant="bodyLg" color="textMuted">
          ›
        </Text>
      </View>
    </Pressable>
  );
}
