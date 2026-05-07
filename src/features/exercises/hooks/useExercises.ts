import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listExercises } from '../api/listExercises';
import type { MuscleGroup } from '../types';

export function useExercises(filter?: MuscleGroup) {
  return useQuery({
    queryKey: qk.exercises.list(filter),
    queryFn: () => listExercises(filter),
    staleTime: 5 * 60 * 1000,
  });
}
