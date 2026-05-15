import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TierBadge } from '@/components/shared/TierBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/formatDate';
import type { UserListRow } from '../api/listUsers';

export interface UsersTableProps {
  rows: UserListRow[];
  loading?: boolean;
}

export function UsersTable({ rows, loading }: UsersTableProps) {
  const navigate = useNavigate();

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
    return (
      <EmptyState title="Пользователей не найдено" description="Попробуйте изменить фильтры" />
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Имя</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Истекает</TableHead>
            <TableHead>Возобновится</TableHead>
            <TableHead>Создан</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => navigate(`/users/${row.id}`)}
              data-testid="user-row"
            >
              <TableCell className="font-medium">{row.email ?? '—'}</TableCell>
              <TableCell>{row.display_name ?? '—'}</TableCell>
              <TableCell>
                <TierBadge tier={row.subscription_tier} />
              </TableCell>
              <TableCell>
                <StatusBadge status={row.subscription_status} />
              </TableCell>
              <TableCell>{formatDate(row.subscription_expires_at)}</TableCell>
              <TableCell>{row.subscription_will_renew ? '✓' : '—'}</TableCell>
              <TableCell>{formatDate(row.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
