import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme';

export default function OnboardingScreen() {
  const theme = useTheme();
  const signIn = useAuthStore((state) => state.signIn);

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
              Демо-доступ
            </Text>
            <Text variant="body" color="textMuted">
              В Итерации 0 включён mock-логин — нажми «Продолжить», чтобы посмотреть табы.
            </Text>
          </View>
        </Card>

        <View style={{ gap: theme.spacing.md }}>
          <Button
            label="Продолжить (mock)"
            fullWidth
            onPress={() => {
              signIn('demo-user');
              router.replace('/(tabs)/home');
            }}
          />
          <Button
            label="Войти"
            variant="secondary"
            fullWidth
            onPress={() => router.push('/(auth)/sign-in')}
          />
          <Button
            label="Создать аккаунт"
            variant="ghost"
            fullWidth
            onPress={() => router.push('/(auth)/sign-up')}
          />
        </View>
      </View>
    </Screen>
  );
}
