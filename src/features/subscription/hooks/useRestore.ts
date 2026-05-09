import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restorePurchases } from '../api';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth.store';

export function useRestore() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: restorePurchases,
    onSuccess: async () => {
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: qk.rc.customerInfo(userId) });
      }
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
