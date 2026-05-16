import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type BlogStatusFilterValue = 'all' | 'published' | 'draft';

const LABELS: Record<BlogStatusFilterValue, string> = {
  all: 'Все статусы',
  published: 'Опубликованные',
  draft: 'Черновики',
};

export function BlogStatusFilter({
  value,
  onChange,
}: {
  value: BlogStatusFilterValue;
  onChange: (v: BlogStatusFilterValue) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as BlogStatusFilterValue)}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Статус" />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABELS) as BlogStatusFilterValue[]).map((k) => (
          <SelectItem key={k} value={k}>
            {LABELS[k]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
