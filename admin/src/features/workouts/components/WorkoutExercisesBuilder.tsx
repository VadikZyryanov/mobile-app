import { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExercisePicker, type ExerciseLite } from '@/components/shared/ExercisePicker';
import { cn } from '@/lib/utils';

export interface BuilderRow {
  uid: string;
  exercise_id: string | null;
  exercise?: ExerciseLite | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
}

export interface WorkoutExercisesBuilderProps {
  value: BuilderRow[];
  onChange: (rows: BuilderRow[]) => void;
}

let uidCounter = 0;
export function makeUid(): string {
  uidCounter += 1;
  return `r-${Date.now()}-${uidCounter}`;
}

function SortableRow({
  row,
  index,
  onRowChange,
  onRemove,
}: {
  row: BuilderRow;
  index: number;
  onRowChange: (patch: Partial<BuilderRow>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.uid,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'grid grid-cols-[24px_24px_minmax(180px,1fr)_72px_88px_88px_minmax(140px,1fr)_32px] items-start gap-2 p-2 border rounded-md bg-white',
        isDragging && 'opacity-60 z-10',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground h-9 flex items-center justify-center"
        aria-label="Перетащить"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-9 flex items-center text-sm text-muted-foreground">{index + 1}</div>
      <div>
        <ExercisePicker
          value={row.exercise_id}
          initialSelected={row.exercise ?? null}
          onChange={(id, ex) => onRowChange({ exercise_id: id, exercise: ex })}
        />
      </div>
      <div>
        <Input
          type="number"
          min={1}
          value={row.sets}
          onChange={(e) => onRowChange({ sets: Number(e.target.value) || 0 })}
          className="h-9"
          aria-label="Подходов"
        />
      </div>
      <div>
        <Input
          value={row.reps}
          onChange={(e) => onRowChange({ reps: e.target.value })}
          className="h-9"
          placeholder="8-12"
          aria-label="Повторений"
        />
      </div>
      <div>
        <Input
          type="number"
          min={0}
          value={row.rest_seconds}
          onChange={(e) => onRowChange({ rest_seconds: Number(e.target.value) || 0 })}
          className="h-9"
          aria-label="Отдых, сек"
        />
      </div>
      <div>
        <Textarea
          rows={1}
          value={row.notes}
          onChange={(e) => onRowChange({ notes: e.target.value })}
          placeholder="Заметки"
          className="min-h-[36px] py-1.5"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-9 w-9 text-destructive"
        aria-label="Удалить"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function WorkoutExercisesBuilder({ value, onChange }: WorkoutExercisesBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function patchRow(uid: string, patch: Partial<BuilderRow>) {
    onChange(value.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  }

  function removeRow(uid: string) {
    onChange(value.filter((r) => r.uid !== uid));
  }

  function addRow() {
    onChange([
      ...value,
      {
        uid: makeUid(),
        exercise_id: null,
        sets: 3,
        reps: '10',
        rest_seconds: 60,
        notes: '',
      },
    ]);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = value.findIndex((r) => r.uid === active.id);
    const newIdx = value.findIndex((r) => r.uid === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(value, oldIdx, newIdx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Упражнения ({value.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      <div className="grid grid-cols-[24px_24px_minmax(180px,1fr)_72px_88px_88px_minmax(140px,1fr)_32px] items-center gap-2 px-2 text-xs text-muted-foreground">
        <span />
        <span>#</span>
        <span>Упражнение</span>
        <span>Подх.</span>
        <span>Повт.</span>
        <span>Отдых</span>
        <span>Заметки</span>
        <span />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={value.map((r) => r.uid)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {value.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center border rounded-md">
                Добавь упражнения для тренировки
              </p>
            ) : (
              value.map((row, idx) => (
                <SortableRow
                  key={row.uid}
                  row={row}
                  index={idx}
                  onRowChange={(p) => patchRow(row.uid, p)}
                  onRemove={() => removeRow(row.uid)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {activeId ? null : null}
    </div>
  );
}
