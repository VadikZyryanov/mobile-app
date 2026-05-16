import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MUSCLE_GROUPS, MUSCLE_LABELS, type MuscleGroup } from '@/types/content';

export type MuscleFilterValue = MuscleGroup | 'all';

export function MuscleFilter({
  value,
  onChange,
}: {
  value: MuscleFilterValue;
  onChange: (v: MuscleFilterValue) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MuscleFilterValue)}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Все мышцы" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все мышцы</SelectItem>
        {MUSCLE_GROUPS.map((m) => (
          <SelectItem key={m} value={m}>
            {MUSCLE_LABELS[m]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
