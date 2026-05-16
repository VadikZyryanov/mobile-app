import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getProgramDetail } from '../api/getProgramDetail';

export function useProgramDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.programs.detail(id) : (['programs', 'detail', 'none'] as const),
    queryFn: () => getProgramDetail(id as string),
    enabled: !!id,
  });
}
