import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listFoods } from '../api/listFoods';

export function useFoods(q?: string) {
  return useQuery({
    queryKey: qk.nutrition.foods(q),
    queryFn: () => listFoods(q),
    staleTime: q ? 5 * 60 * 1000 : 30 * 60 * 1000,
    gcTime: q ? 30 * 60 * 1000 : 60 * 60 * 1000,
  });
}
