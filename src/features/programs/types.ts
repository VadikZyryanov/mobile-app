import type { Database } from '@/lib/database.types';

export type Program = Database['public']['Tables']['programs']['Row'];
export type ProgramWorkout = Database['public']['Tables']['program_workouts']['Row'];

export type ProgramDetail = Program & {
  schedule: Array<
    ProgramWorkout & {
      workout: { slug: string; title: string };
    }
  >;
};
