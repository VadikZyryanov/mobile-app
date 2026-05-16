import { supabase } from '@/lib/supabase';
import type { Json } from '@shared/lib/database.types';

export interface SaveProgramInput {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  cover_path?: string | null;
  weeks: number;
  sessions_per_week: number;
  difficulty: number;
  min_tier: string;
}

export interface SaveProgramScheduleEntry {
  week: number;
  day_of_week: number;
  workout_id: string;
}

export async function saveProgram(
  program: SaveProgramInput,
  schedule: SaveProgramScheduleEntry[],
): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc('admin_save_program_with_workouts', {
    p_program: program as unknown as Json,
    p_schedule: schedule as unknown as Json,
  });
  if (error) throw error;
  const result = data as { id: string } | null;
  if (!result?.id) throw new Error('RPC вернул пустой результат');
  return { id: result.id };
}
