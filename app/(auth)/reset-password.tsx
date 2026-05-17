import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { LockIcon, TopBar } from '@/components/shared';
import { Button, Input, Screen, Text } from '@/components/ui';
import { updatePassword } from '@/features/auth/api/updatePassword';
import { useTheme } from '@/theme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    const res = await updatePassword(password);
    setLoading(false);
    if (res.ok) {
      router.replace('/(tabs)/home');
    } else {
      setError(res.error);
    }
  };

  return (
    <Screen scroll header={<TopBar leading="back" onLeadingPress={() => router.back()} />}>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="display" weight="bold">
            Новый пароль
          </Text>
          <Text variant="body" color="textMuted">
            Минимум 8 символов.
          </Text>
        </View>

        <Input
          label="Пароль"
          placeholder="Новый пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leadingIcon={<LockIcon color={theme.colors.textMuted} />}
        />
        <Input
          label="Подтверждение"
          placeholder="Повтори пароль"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          leadingIcon={<LockIcon color={theme.colors.textMuted} />}
        />

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Сохранить" fullWidth loading={loading} onPress={() => void submit()} />
      </View>
    </Screen>
  );
}
