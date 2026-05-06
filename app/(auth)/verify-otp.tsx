import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { signInWithPhone } from '@/features/auth/api/signInWithPhone';
import { verifyPhoneOtp } from '@/features/auth/api/verifyPhoneOtp';
import { useTheme } from '@/theme';

const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone ?? '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await verifyPhoneOtp(phone, code);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  const resend = async () => {
    setError(null);
    const res = await signInWithPhone(phone);
    if (res.ok) setCooldown(RESEND_COOLDOWN);
    else setError(res.error);
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Введи код
          </Text>
          <Text variant="body" color="textMuted">
            SMS отправлено на {phone}.
          </Text>
        </View>

        <Input
          label="Код"
          placeholder="123456"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Подтвердить" fullWidth loading={loading} onPress={() => void submit()} />
        <Button
          label={cooldown > 0 ? `Отправить ещё раз (${cooldown}с)` : 'Отправить ещё раз'}
          variant="ghost"
          fullWidth
          disabled={cooldown > 0}
          onPress={() => void resend()}
        />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
