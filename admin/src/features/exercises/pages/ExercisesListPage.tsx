import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { SoftDeleteToggle } from '@/components/shared/SoftDeleteToggle';
import { ExercisesTable } from '../components/ExercisesTable';
import { ExerciseFormDialog } from '../components/ExerciseFormDialog';
import { MuscleFilter, type MuscleFilterValue } from '../components/MuscleFilter';
import { TierFilter, type TierFilterValue } from '../components/TierFilter';
import { useExercises } from '../hooks/useExercises';
import type { Exercise, MuscleGroup, SubscriptionTier } from '@/types/content';

const PAGE_SIZE = 50;

export function ExercisesListPage() {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<MuscleFilterValue>('all');
  const [tier, setTier] = useState<TierFilterValue>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      primaryMuscle: muscle === 'all' ? undefined : (muscle as MuscleGroup),
      minTier: tier === 'all' ? undefined : (tier as SubscriptionTier),
      includeDeleted,
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [search, muscle, tier, includeDeleted, pageIndex],
  );

  const { data, isLoading } = useExercises(filters);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(ex: Exercise) {
    setEditing(ex);
    setFormOpen(true);
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Упражнения</h1>
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
        <MuscleFilter
          value={muscle}
          onChange={(v) => {
            setMuscle(v);
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

      <ExercisesTable rows={data?.rows ?? []} loading={isLoading} onRowClick={openEdit} />

      <DataTablePagination
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
      />

      <ExerciseFormDialog open={formOpen} onOpenChange={setFormOpen} exercise={editing} />
    </div>
  );
}
