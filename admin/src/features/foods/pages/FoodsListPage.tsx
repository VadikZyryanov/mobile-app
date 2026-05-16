import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { SoftDeleteToggle } from '@/components/shared/SoftDeleteToggle';
import { FoodsTable } from '../components/FoodsTable';
import { FoodFormDialog } from '../components/FoodFormDialog';
import { useFoods } from '../hooks/useFoods';
import type { Food } from '@/types/content';

const PAGE_SIZE = 50;

export function FoodsListPage() {
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      includeDeleted,
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [search, includeDeleted, pageIndex],
  );

  const { data, isLoading } = useFoods(filters);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(food: Food) {
    setEditing(food);
    setFormOpen(true);
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Продукты</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Создать
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <DebouncedSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPageIndex(0);
          }}
          placeholder="Поиск по названию / slug / бренду"
        />
        <SoftDeleteToggle
          value={includeDeleted}
          onChange={(v) => {
            setIncludeDeleted(v);
            setPageIndex(0);
          }}
        />
      </div>

      <FoodsTable rows={data?.rows ?? []} loading={isLoading} onRowClick={openEdit} />

      <DataTablePagination
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
      />

      <FoodFormDialog open={formOpen} onOpenChange={setFormOpen} food={editing} />
    </div>
  );
}
