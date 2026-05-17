import { router } from 'expo-router';
import { View } from 'react-native';

import { AppIcon } from '@/components/brand';
import { Button, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function OnboardingScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View
        style={{ flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing['2xl'] }}
      >
        <View style={{ alignItems: 'center', gap: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
          <AppIcon size={140} radius={36} />
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="display" weight="bold" align="center">
              Fitness App
            </Text>
            <Text variant="bodyLg" color="textMuted" align="center">
              Тренировки, программы, блог тренера. Всё в одном месте.
            </Text>
          </View>
        </View>

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
