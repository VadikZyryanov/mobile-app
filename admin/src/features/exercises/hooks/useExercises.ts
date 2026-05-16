import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { qk, type ExercisesListFilters } from '@/lib/queryKeys';
import { listExercises } from '../api/listExercises';
import type { MuscleGroup, SubscriptionTier } from '@/types/content';

export function useExercises(filters: ExercisesListFilters) {
  return useQuery({
    queryKey: qk.exercises.list(filters),
    queryFn: () =>
      listExercises({
        search: filters.search,
        primaryMuscle: filters.primaryMuscle as MuscleGroup | undefined,
        minTier: filters.minTier as SubscriptionTier | undefined,
        includeDeleted: filters.includeDeleted,
        offset: filters.offset,
        limit: filters.limit,
      }),
    placeholderData: keepPreviousData,
  });
}
