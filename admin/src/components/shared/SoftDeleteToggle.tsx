import { Checkbox } from '@/components/ui/checkbox';

export function SoftDeleteToggle({
  value,
  onChange,
  label = 'Показать удалённые',
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
      <Checkbox checked={value} onChange={(e) => onChange(e.currentTarget.checked)} />
      {label}
    </label>
  );
}
