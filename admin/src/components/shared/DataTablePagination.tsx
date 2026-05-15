import { Button } from '@/components/ui/button';

export interface DataTablePaginationProps {
  total: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (next: number) => void;
}

export function DataTablePagination({
  total,
  pageIndex,
  pageSize,
  onPageChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = pageIndex > 0;
  const canNext = pageIndex + 1 < totalPages;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Всего: <strong className="text-foreground">{total}</strong> &nbsp;|&nbsp; Страница{' '}
        {pageIndex + 1} / {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(pageIndex - 1)}
        >
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(pageIndex + 1)}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}
