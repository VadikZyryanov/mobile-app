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
import type { Food } from '@/types/content';

export interface FoodsTableProps {
  rows: Food[];
  loading?: boolean;
  onRowClick?: (food: Food) => void;
}

export function FoodsTable({ rows, loading, onRowClick }: FoodsTableProps) {
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
    return <EmptyState title="Продукты не найдены" description="Попробуйте изменить фильтры" />;
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Бренд</TableHead>
            <TableHead className="text-right">КБЖУ (на 100г)</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn('cursor-pointer', row.deleted_at && 'opacity-50')}
              onClick={() => onRowClick?.(row)}
              data-testid="food-row"
            >
              <TableCell className="font-mono text-xs">{row.slug}</TableCell>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.brand ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {row.kcal_per_100g} / {row.protein_per_100g}Б / {row.fat_per_100g}Ж /{' '}
                {row.carbs_per_100g}У
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
