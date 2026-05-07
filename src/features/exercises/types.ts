import type { Database } from '@/lib/database.types';

export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type MuscleGroup = Database['public']['Enums']['muscle_group_enum'];
