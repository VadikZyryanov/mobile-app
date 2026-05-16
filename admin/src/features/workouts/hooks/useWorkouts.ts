import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { qk, type WorkoutsListFilters } from '@/lib/queryKeys';
import { listWorkouts } from '../api/listWorkouts';
import type { SubscriptionTier, WorkoutCategory } from '@/types/content';

export function useWorkouts(filters: WorkoutsListFilters) {
  return useQuery({
    queryKey: qk.workouts.list(filters),
    queryFn: () =>
      listWorkouts({
        search: filters.search,
        category: filters.category as WorkoutCategory | undefined,
        minTier: filters.minTier as SubscriptionTier | undefined,
        includeDeleted: filters.includeDeleted,
        offset: filters.offset,
        limit: filters.limit,
      }),
    placeholderData: keepPreviousData,
  });
}
