import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { createFood } from '../api/createFood';
import { updateFood } from '../api/updateFood';
import { deleteFood } from '../api/deleteFood';
import { restoreFood } from '../api/restoreFood';
import type { FoodInsert, FoodUpdate } from '@/types/content';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.foods.all });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FoodInsert) => createFood(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: FoodUpdate }) => updateFood(id, patch),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: () => invalidate(qc),
  });
}

export function useRestoreFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreFood(id),
    onSuccess: () => invalidate(qc),
  });
}
