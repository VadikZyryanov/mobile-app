import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listEntriesForDate } from '../api/listEntriesForDate';

export function useDailyEntries(userId: string | undefined, date: string) {
  return useQuery({
    queryKey: qk.nutrition.entries(date),
    queryFn: () => listEntriesForDate(userId!, date),
    enabled: !!userId && !!date,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
