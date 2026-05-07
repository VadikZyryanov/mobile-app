import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getProgramDetail } from '../api/getProgramDetail';

export function useProgramDetail(slug: string | undefined) {
  return useQuery({
    queryKey: qk.programs.detail(slug ?? ''),
    queryFn: () => getProgramDetail(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
