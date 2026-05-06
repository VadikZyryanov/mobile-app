import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { resetPassword } from '@/features/auth/api/resetPassword';
import { useTheme } from '@/theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await resetPassword(email);
    setLoading(false);
    if (res.ok) setSent(true);
    else setError(res.error);
  };

  if (sent) {
    return (
      <Screen>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.lg,
          }}
        >
          <Text variant="hero" weight="bold" align="center">
            Письмо отправлено
          </Text>
          <Text variant="bodyLg" color="textMuted" align="center">
            Проверь {email}. Открой письмо и нажми на ссылку — приложение само откроется.
          </Text>
          <Button label="Готово" fullWidth onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Сброс пароля
          </Text>
          <Text variant="body" color="textMuted">
            Пришлём ссылку для смены пароля.
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

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label="Отправить ссылку"
          fullWidth
          loading={loading}
          onPress={() => void submit()}
        />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
