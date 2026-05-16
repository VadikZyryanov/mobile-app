import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getFoodById } from '../api/getFoodById';

export function useFood(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.foods.detail(id) : (['foods', 'detail', 'none'] as const),
    queryFn: () => getFoodById(id as string),
    enabled: !!id,
  });
}
