import { View } from 'react-native';

import { useTheme } from '@/theme';

export function DifficultyDots({ level }: { level: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < level;
        return (
          <View
            key={i}
            testID="dot"
            accessibilityState={{ selected: filled }}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: filled ? theme.colors.accent : theme.colors.divider,
            }}
          />
        );
      })}
    </View>
  );
}
