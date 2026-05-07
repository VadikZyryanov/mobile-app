import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listWorkouts } from '../api/listWorkouts';
import type { WorkoutCategory } from '../types';

export function useWorkouts(category?: WorkoutCategory) {
  return useQuery({
    queryKey: qk.workouts.list(category),
    queryFn: () => listWorkouts(category),
    staleTime: 5 * 60 * 1000,
  });
}
