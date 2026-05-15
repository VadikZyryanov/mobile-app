import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIERS, TIER_LABELS, type SubscriptionTier } from '@/types/shared';

export type TierFilterValue = SubscriptionTier | 'all';

export function TierFilter({
  value,
  onChange,
}: {
  value: TierFilterValue;
  onChange: (v: TierFilterValue) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TierFilterValue)}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Tier" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все tier</SelectItem>
        {TIERS.map((t) => (
          <SelectItem key={t} value={t}>
            {TIER_LABELS[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
