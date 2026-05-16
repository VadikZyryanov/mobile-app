import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import {
  TIER_LABELS,
  WORKOUT_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type Workout,
} from '@/types/content';

export interface WorkoutsTableProps {
  rows: Workout[];
  loading?: boolean;
  onRowClick?: (row: Workout) => void;
}

export function WorkoutsTable({ rows, loading, onRowClick }: WorkoutsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <EmptyState title="Тренировок не найдено" description="Попробуйте изменить фильтры" />;
  }
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead className="text-right">Время</TableHead>
            <TableHead>Сложность</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn('cursor-pointer', row.deleted_at && 'opacity-50')}
              onClick={() => onRowClick?.(row)}
              data-testid="workout-row"
            >
              <TableCell className="font-mono text-xs">{row.slug}</TableCell>
              <TableCell className="font-medium">{row.title}</TableCell>
              <TableCell>{WORKOUT_CATEGORY_LABELS[row.category]}</TableCell>
              <TableCell className="text-right tabular-nums">{row.duration_minutes} мин</TableCell>
              <TableCell>{DIFFICULTY_LABELS[row.difficulty] ?? row.difficulty}</TableCell>
              <TableCell>
                <Badge variant="outline">{TIER_LABELS[row.min_tier]}</Badge>
              </TableCell>
              <TableCell>
                {row.deleted_at ? (
                  <Badge variant="secondary">Удалёна</Badge>
                ) : (
                  <Badge>Активна</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
