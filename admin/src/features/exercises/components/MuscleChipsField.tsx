import { X } from 'lucide-react';
import { MUSCLE_GROUPS, MUSCLE_LABELS, type MuscleGroup } from '@/types/content';
import { cn } from '@/lib/utils';

export function MuscleChipsField({
  value,
  onChange,
  exclude,
  label,
}: {
  value: MuscleGroup[];
  onChange: (v: MuscleGroup[]) => void;
  exclude?: MuscleGroup;
  label?: string;
}) {
  const isSelected = (m: MuscleGroup) => value.includes(m);

  function toggle(m: MuscleGroup) {
    if (isSelected(m)) {
      onChange(value.filter((x) => x !== m));
    } else {
      onChange([...value, m]);
    }
  }

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_GROUPS.filter((m) => m !== exclude).map((m) => {
          const sel = isSelected(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full border transition-colors inline-flex items-center gap-1',
                sel
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50',
              )}
            >
              {MUSCLE_LABELS[m]}
              {sel ? <X className="h-3 w-3" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
