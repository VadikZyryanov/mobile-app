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
import { DIFFICULTY_LABELS, TIER_LABELS, type Program } from '@/types/content';

export interface ProgramsTableProps {
  rows: Program[];
  loading?: boolean;
  onRowClick?: (row: Program) => void;
}

export function ProgramsTable({ rows, loading, onRowClick }: ProgramsTableProps) {
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
    return <EmptyState title="Программы не найдены" description="Попробуйте изменить фильтры" />;
  }
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Название</TableHead>
            <TableHead className="text-right">Недель</TableHead>
            <TableHead className="text-right">Сессий/нед</TableHead>
            <TableHead>Сложность</TableHead>
            <TableHead>Tier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => onRowClick?.(row)}
              data-testid="program-row"
            >
              <TableCell className="font-mono text-xs">{row.slug}</TableCell>
              <TableCell className="font-medium">{row.title}</TableCell>
              <TableCell className="text-right tabular-nums">{row.weeks}</TableCell>
              <TableCell className="text-right tabular-nums">{row.sessions_per_week}</TableCell>
              <TableCell>{DIFFICULTY_LABELS[row.difficulty] ?? row.difficulty}</TableCell>
              <TableCell>
                <Badge variant="outline">{TIER_LABELS[row.min_tier]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
