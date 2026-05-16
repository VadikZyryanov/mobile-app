import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import {
  saveWorkout,
  type SaveWorkoutExerciseInput,
  type SaveWorkoutInput,
} from '../api/saveWorkout';
import { deleteWorkout } from '../api/deleteWorkout';
import { restoreWorkout } from '../api/restoreWorkout';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.workouts.all });
}

export function useSaveWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workout,
      exercises,
    }: {
      workout: SaveWorkoutInput;
      exercises: SaveWorkoutExerciseInput[];
    }) => saveWorkout(workout, exercises),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkout(id),
    onSuccess: () => invalidate(qc),
  });
}

export function useRestoreWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreWorkout(id),
    onSuccess: () => invalidate(qc),
  });
}
