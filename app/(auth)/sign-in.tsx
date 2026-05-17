import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EnvelopeIcon, LockIcon, PhoneIcon, TopBar } from '@/components/shared';
import { Button, Input, Screen, Segmented, Text } from '@/components/ui';
import { signInWithEmail } from '@/features/auth/api/signInWithEmail';
import { signInWithPhone } from '@/features/auth/api/signInWithPhone';
import { useTheme } from '@/theme';

const MODES = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
] as const;
type Mode = (typeof MODES)[number]['value'];

export default function SignInScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async () => {
    setLoading(true);
    setError(null);
    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  const submitPhone = async () => {
    setLoading(true);
    setError(null);
    const res = await signInWithPhone(phone);
    setLoading(false);
    if (res.ok) {
      router.push({ pathname: '/(auth)/verify-otp', params: { phone } } as unknown as Href);
    } else {
      setError(res.error);
    }
  };

  return (
    <Screen scroll header={<TopBar leading="back" onLeadingPress={() => router.back()} />}>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="display" weight="bold">
            Вход
          </Text>
          <Text variant="body" color="textMuted">
            Войди по email или номеру телефона.
          </Text>
        </View>

        <Segmented
          value={mode}
          options={MODES}
          onChange={(v) => {
            setMode(v);
            setError(null);
          }}
        />

        {mode === 'email' ? (
          <>
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
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leadingIcon={<LockIcon color={theme.colors.textMuted} />}
            />
            {error ? (
              <Text variant="body" color="danger">
                {error}
              </Text>
            ) : null}
            <Button label="Войти" fullWidth loading={loading} onPress={() => void submitEmail()} />
            <Button
              label="Забыли пароль?"
              variant="text"
              fullWidth
              onPress={() => router.push('/(auth)/forgot-password' as Href)}
            />
          </>
        ) : (
          <>
            <Input
              label="Номер телефона"
              placeholder="+79991234567"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
              keyboardType="phone-pad"
              leadingIcon={<PhoneIcon color={theme.colors.textMuted} />}
            />
            {error ? (
              <Text variant="body" color="danger">
                {error}
              </Text>
            ) : null}
            <Button
              label="Получить код"
              fullWidth
              loading={loading}
              onPress={() => void submitPhone()}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
