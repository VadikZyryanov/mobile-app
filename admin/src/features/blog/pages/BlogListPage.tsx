import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { BlogPostsTable } from '../components/BlogPostsTable';
import { BlogPostFormDialog } from '../components/BlogPostFormDialog';
import { BlogStatusFilter, type BlogStatusFilterValue } from '../components/BlogStatusFilter';
import { useBlogPosts } from '../hooks/useBlogPosts';
import type { BlogPost } from '@/types/content';

const PAGE_SIZE = 50;

export function BlogListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BlogStatusFilterValue>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status,
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [search, status, pageIndex],
  );

  const { data, isLoading } = useBlogPosts(filters);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditing(post);
    setFormOpen(true);
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Блог</h1>
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
          placeholder="Поиск по заголовку / slug"
        />
        <BlogStatusFilter
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPageIndex(0);
          }}
        />
      </div>

      <BlogPostsTable rows={data?.rows ?? []} loading={isLoading} onRowClick={openEdit} />

      <DataTablePagination
        total={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        onPageChange={setPageIndex}
      />

      <BlogPostFormDialog open={formOpen} onOpenChange={setFormOpen} post={editing} />
    </div>
  );
}
