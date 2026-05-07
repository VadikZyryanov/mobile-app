import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getExercise } from '../api/getExercise';

export function useExercise(slug: string | undefined) {
  return useQuery({
    queryKey: qk.exercises.detail(slug ?? ''),
    queryFn: () => getExercise(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
