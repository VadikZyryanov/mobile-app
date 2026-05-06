import { View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function HomeScreen() {
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
          Главная
        </Text>

        <Card variant="glass">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="title" weight="semibold">
              Это заглушка
            </Text>
            <Text variant="body" color="textMuted">
              В следующих итерациях здесь будут приветствие, прогресс, рекомендованные тренировки и
              блок мотивации.
            </Text>
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="title" weight="semibold">
              Base Card
            </Text>
            <Text variant="body" color="textMuted">
              Демонстрация второго варианта карточки.
            </Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
