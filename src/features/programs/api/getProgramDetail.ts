import { supabase } from '@/lib/supabase';
import type { ProgramDetail } from '../types';

export async function getProgramDetail(slug: string): Promise<ProgramDetail> {
  const { data, error } = await supabase
    .from('programs')
    .select(
      `
      *,
      program_workouts (
        program_id, week, day_of_week, workout_id,
        workout:workouts ( slug, title )
      )
    `,
    )
    .eq('slug', slug)
    .single();
  if (error) throw error;
  const sorted = [...((data.program_workouts as ProgramDetail['schedule']) ?? [])].sort(
    (a, b) => a.week - b.week || a.day_of_week - b.day_of_week,
  );
  return { ...data, schedule: sorted } as ProgramDetail;
}
