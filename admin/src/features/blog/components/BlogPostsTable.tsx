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
import { formatDate } from '@/lib/formatDate';
import type { BlogPostListRow } from '../api/listBlogPosts';

export interface BlogPostsTableProps {
  rows: BlogPostListRow[];
  loading?: boolean;
  onRowClick?: (post: BlogPostListRow) => void;
}

export function BlogPostsTable({ rows, loading, onRowClick }: BlogPostsTableProps) {
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
    return <EmptyState title="Постов не найдено" description="Попробуйте изменить фильтры" />;
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Заголовок</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Опубликован</TableHead>
            <TableHead>Автор</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => onRowClick?.(row)}
              data-testid="blog-row"
            >
              <TableCell className="font-mono text-xs">{row.slug}</TableCell>
              <TableCell className="font-medium">{row.title}</TableCell>
              <TableCell>
                {row.published_at ? (
                  <Badge>Опубликован</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </TableCell>
              <TableCell>{formatDate(row.published_at)}</TableCell>
              <TableCell className="text-sm">
                {row.author?.display_name ?? row.author?.email ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
