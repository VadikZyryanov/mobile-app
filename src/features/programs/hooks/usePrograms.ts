import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listPrograms } from '../api/listPrograms';

export function usePrograms() {
  return useQuery({
    queryKey: qk.programs.list(),
    queryFn: listPrograms,
    staleTime: 5 * 60 * 1000,
  });
}
