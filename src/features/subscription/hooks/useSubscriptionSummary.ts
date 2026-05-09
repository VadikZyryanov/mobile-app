import { useProfile } from '@/features/auth/hooks/useProfile';
import { useCustomerInfo } from './useCustomerInfo';
import { mapEntitlementsToTier } from '../lib/mapEntitlementsToTier';
import type { Tier, SubscriptionStatus } from '../types';

export interface SubscriptionSummary {
  tier: Tier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  willRenew: boolean;
  productId: string | null;
  manageUrl: string | null;
  isActive: boolean;
  isGrace: boolean;
}

export function useSubscriptionSummary(): { data: SubscriptionSummary | null; isLoading: boolean } {
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: customerInfo, isLoading: loadingRC } = useCustomerInfo();

  if (loadingProfile || loadingRC || !profile) {
    return { data: null, isLoading: true };
  }

  const rcTier = customerInfo ? mapEntitlementsToTier(customerInfo) : null;
  const tier: Tier = rcTier ?? profile.subscription_tier;
  const status: SubscriptionStatus = profile.subscription_status;

  return {
    data: {
      tier,
      status,
      expiresAt: profile.subscription_expires_at,
      willRenew: profile.subscription_will_renew,
      productId: profile.subscription_product_id,
      manageUrl: customerInfo?.managementURL ?? null,
      isActive: status === 'active' || status === 'in_grace_period',
      isGrace: status === 'in_grace_period' || status === 'in_billing_retry',
    },
    isLoading: false,
  };
}
