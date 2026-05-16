import { useQuery } from '@tanstack/react-query';
import { qk, type AuditListFilters } from '@/lib/queryKeys';
import { listAuditLog } from '../api/listAuditLog';

export function useAuditLog(filters: AuditListFilters) {
  return useQuery({
    queryKey: qk.audit.list(filters),
    queryFn: () => listAuditLog(filters),
  });
}
