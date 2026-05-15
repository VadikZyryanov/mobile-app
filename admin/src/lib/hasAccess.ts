import type { Database } from '@shared/lib/database.types';

export type SubscriptionTier = Database['public']['Enums']['subscription_tier_enum'];

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  pro_max: 3,
};

export function hasAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier];
}
