import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { signInWithEmail } from '@/features/auth/api/signInWithEmail';
import { useTheme } from '@/theme';

export default function SignInScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Вход
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

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Войти" fullWidth loading={loading} onPress={() => void submit()} />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
