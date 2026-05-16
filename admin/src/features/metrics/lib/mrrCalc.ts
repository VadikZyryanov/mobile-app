export const TIER_MONTHLY_PRICE_USD: Record<string, number> = {
  basic: 4.99,
  pro: 9.99,
  pro_max: 14.99,
};

export function calcMrr(activeSubs: { tier: string; count: number }[]): number {
  return activeSubs.reduce((sum, { tier, count }) => {
    return sum + (TIER_MONTHLY_PRICE_USD[tier] ?? 0) * count;
  }, 0);
}
