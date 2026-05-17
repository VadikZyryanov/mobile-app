import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { TopBar } from '@/components/shared';
import { Button, OtpInput, Screen, Text } from '@/components/ui';
import { signInWithPhone } from '@/features/auth/api/signInWithPhone';
import { verifyPhoneOtp } from '@/features/auth/api/verifyPhoneOtp';
import { useTheme } from '@/theme';

const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 6;

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
    <Screen scroll header={<TopBar leading="back" onLeadingPress={() => router.back()} />}>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="display" weight="bold">
            Введи код
          </Text>
          <Text variant="body" color="textMuted">
            SMS отправлено на {phone}.
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.md }}>
          <OtpInput value={code} onChange={setCode} length={OTP_LENGTH} autoFocus />
        </View>

        {error ? (
          <Text variant="body" color="danger" align="center">
            {error}
          </Text>
        ) : null}

        <Button label="Подтвердить" fullWidth loading={loading} onPress={() => void submit()} />
        <Button
          label={cooldown > 0 ? `Отправить ещё раз (${cooldown}с)` : 'Отправить ещё раз'}
          variant="text"
          fullWidth
          disabled={cooldown > 0}
          onPress={() => void resend()}
        />
      </View>
    </Screen>
  );
}
