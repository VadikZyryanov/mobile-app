import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overrideSubscription, type OverrideSubscriptionInput } from '../api/overrideSubscription';
import { qk } from '@/lib/queryKeys';

export function useOverrideSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OverrideSubscriptionInput) => overrideSubscription(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: qk.users.all });
      qc.invalidateQueries({ queryKey: qk.users.detail(variables.userId) });
    },
  });
}
