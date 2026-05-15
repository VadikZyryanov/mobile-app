import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UsersTable } from '../components/UsersTable';
import { TierFilter, type TierFilterValue } from '../components/TierFilter';
import { UserSearchInput } from '../components/UserSearchInput';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { UserDetailDrawer } from '../components/UserDetailDrawer';
import { useUsers } from '../hooks/useUsers';

const PAGE_SIZE = 50;

export function UsersListPage() {
  const { id: selectedId } = useParams<{ id?: string }>();
  const [tier, setTier] = useState<TierFilterValue>('all');
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  const filters = useMemo(
    () => ({
      tier: tier === 'all' ? undefined : tier,
      search: search || undefined,
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [tier, search, pageIndex],
  );

  const { data, isLoading } = useUsers(filters);

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <TierFilter
          value={tier}
          onChange={(v) => {
            setTier(v);
            setPageIndex(0);
          }}
        />
        <UserSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPageIndex(0);
          }}
        />
      </div>

      <UsersTable rows={data?.rows ?? []} loading={isLoading} />

      <DataTablePagination
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
      />

      <UserDetailDrawer userId={selectedId} />
    </div>
  );
}
