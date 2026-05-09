import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Text } from '@/components/ui';
import { TierBadge } from './TierBadge';
import { useSubscriptionSummary } from '@/features/subscription/hooks/useSubscriptionSummary';
import { useRestore } from '@/features/subscription/hooks/useRestore';
import { TIER_NAMES } from '@/features/subscription/lib/tierFeatures';
import { useTheme } from '@/theme';

const fmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return fmt.format(new Date(iso));
}

export function SubscriptionSummaryCard() {
  const theme = useTheme();
  const router = useRouter();
  const { data: summary, isLoading } = useSubscriptionSummary();
  const { mutate: restore, isPending: restoring } = useRestore();

  if (isLoading || !summary) return null;

  const { tier, status, expiresAt, willRenew, manageUrl, isGrace } = summary;
  const isFree = tier === 'free';

  function getBadgeText(): string | null {
    if (isFree) return null;
    if (isGrace) return 'Проблема с оплатой';
    if (status === 'cancelled') return 'Отменена';
    return null;
  }

  const badgeText = getBadgeText();

  return (
    <Card variant="glass">
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <TierBadge tier={tier} />
          {badgeText && (
            <Text variant="caption" weight="bold" style={{ color: theme.colors.danger }}>
              {badgeText}
            </Text>
          )}
        </View>

        <Text variant="title" weight="bold">
          {TIER_NAMES[tier]}
        </Text>

        {!isFree && expiresAt && (
          <Text variant="body" color="textMuted">
            {willRenew && status === 'active'
              ? `Продлевается ${formatDate(expiresAt)}`
              : `Действует до ${formatDate(expiresAt)}`}
          </Text>
        )}

        {isFree ? (
          <Button
            label="Оформить подписку"
            variant="primary"
            size="md"
            onPress={() => router.push('/paywall' as never)}
          />
        ) : manageUrl ? (
          <Button
            label="Управление подпиской"
            variant="secondary"
            size="md"
            onPress={() => Linking.openURL(manageUrl)}
          />
        ) : null}

        <Button
          label={restoring ? 'Восстанавливаем…' : 'Восстановить покупки'}
          variant="ghost"
          size="sm"
          onPress={() => restore()}
          disabled={restoring}
        />
      </View>
    </Card>
  );
}
