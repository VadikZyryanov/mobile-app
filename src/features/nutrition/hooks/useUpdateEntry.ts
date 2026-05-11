import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { updateEntry } from '../api/updateEntry';
import type { UpdateEntryInput } from '../api/updateEntry';

export function useUpdateEntry(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEntryInput) => updateEntry(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.nutrition.entries(date) });
    },
  });
}
