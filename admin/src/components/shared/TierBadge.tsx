import { Badge } from '@/components/ui/badge';
import { TIER_LABELS, type SubscriptionTier } from '@/types/shared';

const VARIANTS: Record<SubscriptionTier, 'muted' | 'secondary' | 'brand' | 'default'> = {
  free: 'muted',
  basic: 'secondary',
  pro: 'brand',
  pro_max: 'default',
};

export function TierBadge({ tier }: { tier: SubscriptionTier | null | undefined }) {
  if (!tier) return <span className="text-muted-foreground text-xs">—</span>;
  return <Badge variant={VARIANTS[tier]}>{TIER_LABELS[tier]}</Badge>;
}
