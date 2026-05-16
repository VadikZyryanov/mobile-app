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
import { MUSCLE_LABELS, TIER_LABELS, type Exercise } from '@/types/content';

export interface ExercisesTableProps {
  rows: Exercise[];
  loading?: boolean;
  onRowClick?: (row: Exercise) => void;
}

export function ExercisesTable({ rows, loading, onRowClick }: ExercisesTableProps) {
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
    return <EmptyState title="Упражнения не найдены" description="Попробуйте изменить фильтры" />;
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Мышца</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Медиа</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn('cursor-pointer', row.deleted_at && 'opacity-50')}
              onClick={() => onRowClick?.(row)}
              data-testid="exercise-row"
            >
              <TableCell className="font-mono text-xs">{row.slug}</TableCell>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{MUSCLE_LABELS[row.primary_muscle]}</TableCell>
              <TableCell>
                <Badge variant="outline">{TIER_LABELS[row.min_tier]}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {[row.gif_path && 'GIF', row.video_path && 'Video'].filter(Boolean).join(' • ') ||
                  '—'}
              </TableCell>
              <TableCell>
                {row.deleted_at ? (
                  <Badge variant="secondary">Удалён</Badge>
                ) : (
                  <Badge>Активен</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
