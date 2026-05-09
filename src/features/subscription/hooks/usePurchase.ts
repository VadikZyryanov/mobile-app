import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { purchasePackage } from '../api';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth.store';
import type { PurchasesPackage } from '../types';

export function usePurchase() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
    onSuccess: async (result) => {
      if (result.cancelled) return;

      if (userId) {
        await queryClient.invalidateQueries({ queryKey: qk.rc.customerInfo(userId) });
      }
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      await supabase.rpc('refresh_my_subscription_tier');
    },
  });
}
