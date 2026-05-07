import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getWorkoutDetail } from '../api/getWorkoutDetail';

export function useWorkoutDetail(slug: string | undefined) {
  return useQuery({
    queryKey: qk.workouts.detail(slug ?? ''),
    queryFn: () => getWorkoutDetail(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
