import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { qk, type ProgramsListFilters } from '@/lib/queryKeys';
import { listPrograms } from '../api/listPrograms';
import type { SubscriptionTier } from '@/types/content';

export function usePrograms(filters: ProgramsListFilters) {
  return useQuery({
    queryKey: qk.programs.list(filters),
    queryFn: () =>
      listPrograms({
        search: filters.search,
        minTier: filters.minTier as SubscriptionTier | undefined,
        difficulty: filters.difficulty,
        offset: filters.offset,
        limit: filters.limit,
      }),
    placeholderData: keepPreviousData,
  });
}
