import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { PlanCard } from '@/components/shared/PlanCard';
import { useOfferings } from '@/features/subscription/hooks/useOfferings';
import { usePurchase } from '@/features/subscription/hooks/usePurchase';
import { useRestore } from '@/features/subscription/hooks/useRestore';
import { mapEntitlementsToTier } from '@/features/subscription/lib/mapEntitlementsToTier';
import { useCustomerInfo } from '@/features/subscription/hooks/useCustomerInfo';
import { type Tier } from '@/features/subscription/types';
import { useTheme } from '@/theme';

const PAID_TIERS: Tier[] = ['basic', 'pro', 'pro_max'];

const PACKAGE_TO_TIER: Record<string, Tier> = {
  basic_monthly: 'basic',
  pro_monthly: 'pro',
  pro_max_monthly: 'pro_max',
};

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { required } = useLocalSearchParams<{ required?: string }>();
  const requiredTier = (required as Tier | undefined) ?? 'basic';

  const { data: offering, isLoading: loadingOfferings } = useOfferings();
  const { data: customerInfo } = useCustomerInfo();
  const { mutate: purchase, isPending: purchasing } = usePurchase();
  const { mutate: restore, isPending: restoring } = useRestore();

  const currentTier = customerInfo ? mapEntitlementsToTier(customerInfo) : 'free';

  const packages = offering?.availablePackages ?? [];

  function handlePurchase(pkg: Parameters<typeof purchase>[0]) {
    purchase(pkg, {
      onSuccess: (result) => {
        if (!result.cancelled) router.back();
      },
    });
  }

  function handleRestore() {
    restore(undefined, {
      onSuccess: () => router.back(),
    });
  }

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.base, gap: theme.spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <Text variant="heroLg" weight="bold" align="center">
            Открой больше
          </Text>
          <Text
            variant="body"
            color="textMuted"
            align="center"
            style={{ marginTop: theme.spacing.sm }}
          >
            Выбери подходящий план подписки
          </Text>
        </View>

        {loadingOfferings ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : packages.length === 0 ? (
          <Text align="center" color="textMuted">
            Загрузка предложений…
          </Text>
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {PAID_TIERS.map((tier) => {
              const pkg = packages.find(
                (p) => PACKAGE_TO_TIER[p.packageType] === tier || p.identifier.includes(tier),
              );
              if (!pkg) return null;
              return (
                <PlanCard
                  key={tier}
                  tier={tier}
                  priceString={pkg.product.priceString}
                  pkg={pkg}
                  isCurrentTier={currentTier === tier}
                  isRecommended={tier === requiredTier}
                  onSelect={handlePurchase}
                />
              );
            })}
          </View>
        )}

        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label={restoring ? 'Восстанавливаем…' : 'Восстановить покупки'}
            variant="ghost"
            size="sm"
            onPress={handleRestore}
            disabled={restoring || purchasing}
          />
        </View>

        <View
          style={{ alignItems: 'center', gap: theme.spacing.xs, paddingBottom: theme.spacing.xl }}
        >
          <Text variant="caption" color="textMuted" align="center">
            Управление подпиской доступно в настройках App Store / Google Play.
          </Text>
          <Text variant="caption" color="textMuted" align="center">
            Подписка продлевается автоматически. Отмените в любой момент.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
