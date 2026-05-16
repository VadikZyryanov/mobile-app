import { supabase } from '@/lib/supabase';
import type { AuditListFilters } from '@/lib/queryKeys';

export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  note: string | null;
  created_at: string;
  admin: { display_name: string | null; email: string | null } | null;
  target_user: { display_name: string | null; email: string | null } | null;
}

export interface ListAuditLogResult {
  rows: AuditLogRow[];
  total: number;
}

export async function listAuditLog(filters: AuditListFilters): Promise<ListAuditLogResult> {
  const baseQuery = supabase
    .from('admin_audit_log')
    .select(
      '*, admin:profiles!admin_id(display_name, email), target_user:profiles!target_user_id(display_name, email)',
      { count: 'exact' },
    );

  const filteredQuery = filters.action?.trim()
    ? baseQuery.ilike('action', `%${filters.action.trim()}%`)
    : baseQuery;

  const { data, error, count } = await filteredQuery
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (error) throw error;
  return { rows: (data ?? []) as AuditLogRow[], total: count ?? 0 };
}
