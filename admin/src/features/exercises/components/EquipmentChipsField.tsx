import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function EquipmentChipsField({
  value,
  onChange,
  label,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...value, v]);
    setDraft('');
  }

  function remove(item: string) {
    onChange(value.filter((x) => x !== item));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(item)}
              className="hover:text-destructive"
              aria-label={`Удалить ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder="Введи и нажми Enter"
        className="w-72"
      />
    </div>
  );
}
