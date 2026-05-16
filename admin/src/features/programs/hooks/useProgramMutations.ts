import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import {
  saveProgram,
  type SaveProgramInput,
  type SaveProgramScheduleEntry,
} from '../api/saveProgram';
import { deleteProgram } from '../api/deleteProgram';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.programs.all });
}

export function useSaveProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      program,
      schedule,
    }: {
      program: SaveProgramInput;
      schedule: SaveProgramScheduleEntry[];
    }) => saveProgram(program, schedule),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProgram(id),
    onSuccess: () => invalidate(qc),
  });
}
