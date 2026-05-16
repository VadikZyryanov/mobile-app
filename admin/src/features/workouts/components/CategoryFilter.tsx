import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WORKOUT_CATEGORIES, WORKOUT_CATEGORY_LABELS, type WorkoutCategory } from '@/types/content';

export type CategoryFilterValue = WorkoutCategory | 'all';

export function CategoryFilter({
  value,
  onChange,
}: {
  value: CategoryFilterValue;
  onChange: (v: CategoryFilterValue) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CategoryFilterValue)}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Все категории" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все категории</SelectItem>
        {WORKOUT_CATEGORIES.map((c) => (
          <SelectItem key={c} value={c}>
            {WORKOUT_CATEGORY_LABELS[c]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
