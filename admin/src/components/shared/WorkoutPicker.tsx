import { useEffect, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listWorkouts } from '@/features/workouts/api/listWorkouts';
import type { Workout } from '@/types/content';

export interface WorkoutLite {
  id: string;
  title: string;
  slug?: string;
}

export interface WorkoutPickerProps {
  value: string | null;
  onChange: (id: string | null, workout: WorkoutLite | null) => void;
  initialSelected?: WorkoutLite | null;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  size?: 'sm' | 'default';
}

export function WorkoutPicker({
  value,
  onChange,
  initialSelected,
  placeholder = 'Выбрать тренировку',
  disabled,
  allowClear = true,
  size = 'sm',
}: WorkoutPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<WorkoutLite | null>(initialSelected ?? null);

  useEffect(() => {
    setSelected(initialSelected ?? null);
  }, [initialSelected]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listWorkouts({
      search: debounced || undefined,
      offset: 0,
      limit: 20,
      includeDeleted: false,
    })
      .then((r) => {
        setItems(r.rows);
        if (value) {
          const found = r.rows.find((x) => x.id === value);
          if (found) setSelected({ id: found.id, title: found.title, slug: found.slug });
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, debounced, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size}
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full font-normal"
            disabled={disabled}
          >
            <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
              {selected ? selected.title : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        {allowClear && value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
              onChange(null, null);
            }}
            aria-label="Очистить"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <PopoverContent className="p-0 w-80" align="start">
        <div className="flex items-center border-b px-2 py-1.5">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию / slug"
            className="h-8 border-0 focus-visible:ring-0 px-0"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Ничего не найдено</div>
          ) : (
            items.map((it) => (
              <button
                type="button"
                key={it.id}
                onClick={() => {
                  const lite: WorkoutLite = { id: it.id, title: it.title, slug: it.slug };
                  setSelected(lite);
                  onChange(it.id, lite);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between',
                  it.id === value && 'bg-slate-100',
                )}
              >
                <span className="truncate">
                  <span className="font-medium">{it.title}</span>{' '}
                  <span className="text-muted-foreground text-xs">— {it.slug}</span>
                </span>
                {it.id === value ? <Check className="h-4 w-4 ml-2 shrink-0" /> : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
