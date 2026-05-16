import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { createExercise } from '../api/createExercise';
import { updateExercise } from '../api/updateExercise';
import { deleteExercise } from '../api/deleteExercise';
import { restoreExercise } from '../api/restoreExercise';
import type { ExerciseInsert, ExerciseUpdate } from '@/types/content';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.exercises.all });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExerciseInsert) => createExercise(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ExerciseUpdate }) => updateExercise(id, patch),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => invalidate(qc),
  });
}

export function useRestoreExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreExercise(id),
    onSuccess: () => invalidate(qc),
  });
}
