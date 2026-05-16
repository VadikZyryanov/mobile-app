import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getWorkoutDetail } from '../api/getWorkoutDetail';

export function useWorkoutDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.workouts.detail(id) : (['workouts', 'detail', 'none'] as const),
    queryFn: () => getWorkoutDetail(id as string),
    enabled: !!id,
  });
}
