import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { deleteEntry } from '../api/deleteEntry';

export function useDeleteEntry(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.nutrition.entries(date) });
    },
  });
}
