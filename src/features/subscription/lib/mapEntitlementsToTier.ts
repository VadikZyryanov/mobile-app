import { TIER_ORDER } from '@/features/exercises/lib/tierGate';
import type { CustomerInfo } from '../types';
import { ENTITLEMENT_TO_TIER, type ActiveEntitlement, type Tier } from '../types';

export function mapEntitlementsToTier(customerInfo: CustomerInfo): Tier {
  const activeEntitlements = Object.keys(customerInfo.entitlements.active) as ActiveEntitlement[];

  let maxTier: Tier = 'free';

  for (const entitlement of activeEntitlements) {
    const tier = ENTITLEMENT_TO_TIER[entitlement];
    if (tier && TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(maxTier)) {
      maxTier = tier;
    }
  }

  return maxTier;
}
