import { useState } from 'react';
import { formatDate } from '@/lib/formatDate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuditDiffDialog } from './AuditDiffDialog';
import type { AuditLogRow } from '../api/listAuditLog';

interface Props {
  rows: AuditLogRow[];
}

export function AuditTable({ rows }: Props) {
  const [diffRow, setDiffRow] = useState<AuditLogRow | null>(null);

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Дата</th>
            <th className="py-2 pr-4 font-medium">Действие</th>
            <th className="py-2 pr-4 font-medium">Сущность</th>
            <th className="py-2 pr-4 font-medium">Администратор</th>
            <th className="py-2 pr-4 font-medium">Пользователь</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-slate-50">
              <td className="py-2 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(row.created_at)}
              </td>
              <td className="py-2 pr-4">
                <Badge variant="outline" className="font-mono text-xs">
                  {row.action}
                </Badge>
              </td>
              <td className="py-2 pr-4 text-xs text-muted-foreground">
                {row.entity_type ? `${row.entity_type}` : '—'}
                {row.entity_id ? (
                  <span className="ml-1 font-mono opacity-60">{row.entity_id.slice(0, 8)}…</span>
                ) : null}
              </td>
              <td className="py-2 pr-4 text-xs">
                {row.admin?.display_name ?? row.admin?.email ?? '—'}
              </td>
              <td className="py-2 pr-4 text-xs">
                {row.target_user?.display_name ?? row.target_user?.email ?? '—'}
              </td>
              <td className="py-2">
                {(row.before !== null || row.after !== null) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setDiffRow(row)}
                  >
                    Diff
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                Записей нет
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {diffRow && (
        <AuditDiffDialog
          open
          onOpenChange={(v) => {
            if (!v) setDiffRow(null);
          }}
          action={diffRow.action}
          before={diffRow.before}
          after={diffRow.after}
          note={diffRow.note}
        />
      )}
    </>
  );
}
