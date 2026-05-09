import { useQuery } from '@tanstack/react-query';
import { getOfferings } from '../api';
import { qk } from '@/lib/queryKeys';
import type { PurchasesOffering } from '../types';

export function useOfferings() {
  return useQuery<PurchasesOffering | null>({
    queryKey: qk.rc.offerings,
    queryFn: getOfferings,
    staleTime: 1000 * 60 * 5,
  });
}
