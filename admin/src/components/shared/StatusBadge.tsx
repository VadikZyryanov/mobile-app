import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS, type SubscriptionStatus } from '@/types/shared';

const VARIANTS: Record<SubscriptionStatus, 'success' | 'warning' | 'muted' | 'destructive'> = {
  active: 'success',
  in_grace_period: 'warning',
  in_billing_retry: 'warning',
  paused: 'muted',
  expired: 'destructive',
  cancelled: 'destructive',
  unknown: 'muted',
};

export function StatusBadge({ status }: { status: SubscriptionStatus | null | undefined }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  return <Badge variant={VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
