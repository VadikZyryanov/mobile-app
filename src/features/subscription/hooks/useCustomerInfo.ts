import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Purchases } from '@/lib/revenuecat';
import { getCustomerInfo } from '../api';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth.store';
import type { CustomerInfo } from '../types';

export function useCustomerInfo() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    Purchases.addCustomerInfoUpdateListener((info) => {
      queryClient.setQueryData(qk.rc.customerInfo(userId), info);
    });
  }, [userId, queryClient]);

  return useQuery<CustomerInfo | null>({
    queryKey: userId ? qk.rc.customerInfo(userId) : ['rc', 'customer-info', 'anon'],
    enabled: Boolean(userId),
    queryFn: userId ? getCustomerInfo : () => null,
    staleTime: 1000 * 30,
  });
}
