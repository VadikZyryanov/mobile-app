import { WorkoutPicker, type WorkoutLite } from '@/components/shared/WorkoutPicker';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export interface ScheduleCell {
  workout_id: string | null;
  workout?: WorkoutLite | null;
}

export type ScheduleMap = Record<string, ScheduleCell>;

export function scheduleKey(week: number, day: number): string {
  return `${week}-${day}`;
}

export function scheduleToArray(weeks: number, schedule: ScheduleMap) {
  const out: Array<{ week: number; day_of_week: number; workout_id: string }> = [];
  for (let w = 1; w <= weeks; w += 1) {
    for (let d = 1; d <= 7; d += 1) {
      const cell = schedule[scheduleKey(w, d)];
      if (cell?.workout_id) {
        out.push({ week: w, day_of_week: d, workout_id: cell.workout_id });
      }
    }
  }
  return out;
}

export interface ProgramScheduleBuilderProps {
  weeks: number;
  schedule: ScheduleMap;
  onScheduleChange: (next: ScheduleMap) => void;
}

export function ProgramScheduleBuilder({
  weeks,
  schedule,
  onScheduleChange,
}: ProgramScheduleBuilderProps) {
  function setCell(week: number, day: number, value: ScheduleCell | null) {
    const next = { ...schedule };
    const key = scheduleKey(week, day);
    if (value === null) delete next[key];
    else next[key] = value;
    onScheduleChange(next);
  }

  if (weeks < 1) {
    return <p className="text-sm text-muted-foreground">Укажи кол-во недель</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Расписание ({weeks} нед. × 7 дней)</p>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 min-w-full">
          <thead>
            <tr>
              <th className="w-16 text-xs text-muted-foreground">Неделя</th>
              {DAY_LABELS.map((d) => (
                <th
                  key={d}
                  className="text-xs text-muted-foreground font-normal text-left min-w-[200px]"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: weeks }, (_, i) => i + 1).map((week) => (
              <tr key={week}>
                <td className="text-xs text-muted-foreground align-top pt-2">{week}</td>
                {Array.from({ length: 7 }, (_, j) => j + 1).map((day) => {
                  const cell = schedule[scheduleKey(week, day)];
                  return (
                    <td key={day} className="align-top">
                      <WorkoutPicker
                        value={cell?.workout_id ?? null}
                        initialSelected={cell?.workout ?? null}
                        onChange={(id, w) =>
                          setCell(week, day, id ? { workout_id: id, workout: w ?? null } : null)
                        }
                        placeholder="—"
                        allowClear
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
