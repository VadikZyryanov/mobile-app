import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { userId, signOut } = useAuthStore();

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
          Профиль
        </Text>

        <Card variant="glass">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="title" weight="semibold">
              Пользователь
            </Text>
            <Text variant="body" color="textMuted">
              ID: {userId ?? '—'}
            </Text>
            <Text variant="caption" color="textMuted">
              Управление подпиской и настройки уведомлений — Итерации 1, 3, 4.
            </Text>
          </View>
        </Card>

        <Button
          label="Выйти (mock)"
          variant="secondary"
          fullWidth
          onPress={() => {
            signOut();
            router.replace('/(auth)/onboarding');
          }}
        />
      </View>
    </Screen>
  );
}
