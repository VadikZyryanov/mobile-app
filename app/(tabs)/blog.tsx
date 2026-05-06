import { View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function BlogScreen() {
  const theme = useTheme();

  return (
    <Screen scroll>
      <View
        style={{
          gap: theme.spacing.lg,
          paddingTop: theme.spacing['2xl'],
          paddingBottom: theme.spacing['3xl'] * 2,
        }}
      >
        <Text variant="hero" weight="bold">
          Блог
        </Text>
        <Card variant="glass">
          <Text variant="body" color="textMuted">
            Лента постов и детальная страница — Итерация 2.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
