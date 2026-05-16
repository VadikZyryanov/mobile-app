import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { SoftDeleteToggle } from '@/components/shared/SoftDeleteToggle';
import { WorkoutsTable } from '../components/WorkoutsTable';
import { WorkoutFormDialog } from '../components/WorkoutFormDialog';
import { CategoryFilter, type CategoryFilterValue } from '../components/CategoryFilter';
import { TierFilter, type TierFilterValue } from '@/features/exercises/components/TierFilter';
import { useWorkouts } from '../hooks/useWorkouts';
import type { SubscriptionTier, Workout, WorkoutCategory } from '@/types/content';

const PAGE_SIZE = 50;

export function WorkoutsListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilterValue>('all');
  const [tier, setTier] = useState<TierFilterValue>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category === 'all' ? undefined : (category as WorkoutCategory),
      minTier: tier === 'all' ? undefined : (tier as SubscriptionTier),
      includeDeleted,
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [search, category, tier, includeDeleted, pageIndex],
  );

  const { data, isLoading } = useWorkouts(filters);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(w: Workout) {
    setEditing(w);
    setFormOpen(true);
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Тренировки</h1>
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
          placeholder="Поиск по названию / slug"
        />
        <CategoryFilter
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPageIndex(0);
          }}
        />
        <TierFilter
          value={tier}
          onChange={(v) => {
            setTier(v);
            setPageIndex(0);
          }}
        />
        <SoftDeleteToggle
          value={includeDeleted}
          onChange={(v) => {
            setIncludeDeleted(v);
            setPageIndex(0);
          }}
        />
      </div>

      <WorkoutsTable rows={data?.rows ?? []} loading={isLoading} onRowClick={openEdit} />

      <DataTablePagination
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
      />

      <WorkoutFormDialog open={formOpen} onOpenChange={setFormOpen} workout={editing} />
    </div>
  );
}
