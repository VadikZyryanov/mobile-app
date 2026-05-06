export const TIER_ORDER = ['free', 'basic', 'pro', 'pro_max'] as const;
export type Tier = (typeof TIER_ORDER)[number];

export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}
