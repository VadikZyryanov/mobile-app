import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EnvelopeIcon, LockIcon, TopBar, UserIcon } from '@/components/shared';
import { Button, Input, Screen, Text } from '@/components/ui';
import { signUpWithEmail } from '@/features/auth/api/signUpWithEmail';
import { useTheme } from '@/theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await signUpWithEmail(email, password, name || undefined);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <Screen scroll header={<TopBar leading="back" onLeadingPress={() => router.back()} />}>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="display" weight="bold">
            Регистрация
          </Text>
          <Text variant="body" color="textMuted">
            Создай аккаунт через email.
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leadingIcon={<EnvelopeIcon color={theme.colors.textMuted} />}
        />
        <Input
          label="Пароль"
          placeholder="не менее 8 символов"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leadingIcon={<LockIcon color={theme.colors.textMuted} />}
        />
        <Input
          label="Имя (необязательно)"
          placeholder="Как тебя называть?"
          value={name}
          onChangeText={setName}
          leadingIcon={<UserIcon color={theme.colors.textMuted} />}
        />

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Создать аккаунт" fullWidth loading={loading} onPress={() => void submit()} />
      </View>
    </Screen>
  );
}
