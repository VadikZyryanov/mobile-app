import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function OnboardingScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View
        style={{ flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing['2xl'] }}
      >
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="hero" weight="bold">
            Fitness App
          </Text>
          <Text variant="bodyLg" color="textMuted">
            Тренировки, программы, блог тренера. Всё в одном месте.
          </Text>
        </View>

        <Card variant="glass">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="title" weight="semibold">
              Войди, чтобы продолжить
            </Text>
            <Text variant="body" color="textMuted">
              Email или номер телефона.
            </Text>
          </View>
        </Card>

        <View style={{ gap: theme.spacing.md }}>
          <Button label="Войти" fullWidth onPress={() => router.push('/(auth)/sign-in')} />
          <Button
            label="Создать аккаунт"
            variant="secondary"
            fullWidth
            onPress={() => router.push('/(auth)/sign-up')}
          />
        </View>
      </View>
    </Screen>
  );
}
