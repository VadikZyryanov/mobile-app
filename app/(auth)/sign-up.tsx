import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Регистрация
          </Text>
          <Text variant="body" color="textMuted">
            Заглушка. Реальная регистрация — Итерация 1.
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Пароль"
          placeholder="не менее 8 символов"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button label="Создать аккаунт" fullWidth disabled />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
