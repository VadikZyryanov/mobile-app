import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme';

export default function SignInScreen() {
  const theme = useTheme();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Вход
          </Text>
          <Text variant="body" color="textMuted">
            Заглушка экрана. Реальный Supabase Auth — Итерация 1.
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
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          label="Войти"
          fullWidth
          onPress={() => {
            signIn('demo-user');
            router.replace('/(tabs)/home');
          }}
        />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
