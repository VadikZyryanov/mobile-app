import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { ProgramsTable } from '../components/ProgramsTable';
import { ProgramFormDialog } from '../components/ProgramFormDialog';
import { DifficultyFilter, type DifficultyFilterValue } from '../components/DifficultyFilter';
import { TierFilter, type TierFilterValue } from '@/features/exercises/components/TierFilter';
import { usePrograms } from '../hooks/usePrograms';
import type { Program, SubscriptionTier } from '@/types/content';

const PAGE_SIZE = 50;

export function ProgramsListPage() {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<TierFilterValue>('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilterValue>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      minTier: tier === 'all' ? undefined : (tier as SubscriptionTier),
      difficulty: difficulty === 'all' ? undefined : difficulty,
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [search, tier, difficulty, pageIndex],
  );

  const { data, isLoading } = usePrograms(filters);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: Program) {
    setEditing(p);
    setFormOpen(true);
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Программы</h1>
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
        <DifficultyFilter
          value={difficulty}
          onChange={(v) => {
            setDifficulty(v);
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
      </div>

      <ProgramsTable rows={data?.rows ?? []} loading={isLoading} onRowClick={openEdit} />

      <DataTablePagination
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
      />

      <ProgramFormDialog open={formOpen} onOpenChange={setFormOpen} program={editing} />
    </div>
  );
}
