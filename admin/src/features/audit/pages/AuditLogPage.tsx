import { useMemo, useState } from 'react';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { AuditTable } from '../components/AuditTable';
import { useAuditLog } from '../hooks/useAuditLog';

const PAGE_SIZE = 30;

export function AuditLogPage() {
  const [action, setAction] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  const filters = useMemo(
    () => ({
      action: action || undefined,
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [action, pageIndex],
  );

  const { data, isLoading } = useAuditLog(filters);

  function handleSearch(v: string) {
    setAction(v);
    setPageIndex(0);
  }

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Аудит лог</h1>
        <DebouncedSearchInput
          value={action}
          onChange={handleSearch}
          placeholder="Фильтр по действию…"
          debounceMs={300}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <AuditTable rows={data?.rows ?? []} />
      )}

      <DataTablePagination
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
      />
    </div>
  );
}
