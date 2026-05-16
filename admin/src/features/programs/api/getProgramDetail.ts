import { supabase } from '@/lib/supabase';
import type { Program } from '@/types/content';

export interface ProgramScheduleEntry {
  program_id: string;
  week: number;
  day_of_week: number;
  workout_id: string;
  workout: { id: string; slug: string; title: string } | null;
}

export type ProgramDetail = Program & { program_workouts: ProgramScheduleEntry[] };

export async function getProgramDetail(id: string): Promise<ProgramDetail> {
  const { data, error } = await supabase
    .from('programs')
    .select(
      '*, program_workouts(program_id, week, day_of_week, workout_id, workout:workouts(id, slug, title))',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as ProgramDetail;
}
