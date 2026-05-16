import { supabase } from '@/lib/supabase';
import type { Exercise, MuscleGroup, SubscriptionTier } from '@/types/content';

export interface ListExercisesFilters {
  search?: string;
  primaryMuscle?: MuscleGroup;
  minTier?: SubscriptionTier;
  includeDeleted?: boolean;
  offset: number;
  limit: number;
}

export interface ListExercisesResult {
  rows: Exercise[];
  total: number;
}

export async function listExercises(filters: ListExercisesFilters): Promise<ListExercisesResult> {
  let query = supabase
    .from('exercises')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (!filters.includeDeleted) {
    query = query.is('deleted_at', null);
  }
  if (filters.primaryMuscle) {
    query = query.eq('primary_muscle', filters.primaryMuscle);
  }
  if (filters.minTier) {
    query = query.eq('min_tier', filters.minTier);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[,()]/g, ' ').replace(/\s+/g, '%');
    const pattern = `%${escaped}%`;
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Exercise[], total: count ?? 0 };
}
