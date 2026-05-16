import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { qk, type FoodsListFilters } from '@/lib/queryKeys';
import { listFoods } from '../api/listFoods';

export function useFoods(filters: FoodsListFilters) {
  return useQuery({
    queryKey: qk.foods.list(filters),
    queryFn: () => listFoods(filters),
    placeholderData: keepPreviousData,
  });
}
