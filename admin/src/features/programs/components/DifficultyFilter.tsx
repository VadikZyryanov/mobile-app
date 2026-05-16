import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DIFFICULTY_LABELS, DIFFICULTY_LEVELS } from '@/types/content';

export type DifficultyFilterValue = number | 'all';

export function DifficultyFilter({
  value,
  onChange,
}: {
  value: DifficultyFilterValue;
  onChange: (v: DifficultyFilterValue) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(v === 'all' ? 'all' : Number(v))}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Любая сложность" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Любая сложность</SelectItem>
        {DIFFICULTY_LEVELS.map((d) => (
          <SelectItem key={d} value={String(d)}>
            {d} — {DIFFICULTY_LABELS[d]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
