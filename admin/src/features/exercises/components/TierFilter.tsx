import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIER_OPTIONS, TIER_LABELS, type SubscriptionTier } from '@/types/content';

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
        <SelectValue placeholder="Все тарифы" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все тарифы</SelectItem>
        {TIER_OPTIONS.map((t) => (
          <SelectItem key={t} value={t}>
            {TIER_LABELS[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
