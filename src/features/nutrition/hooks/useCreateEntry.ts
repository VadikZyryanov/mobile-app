import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { createEntry } from '../api/createEntry';
import type { CreateEntryInput } from '../api/createEntry';

export function useCreateEntry(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEntryInput) => createEntry(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.nutrition.entries(date) });
    },
  });
}
