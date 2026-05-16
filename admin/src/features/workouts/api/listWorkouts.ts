import { supabase } from '@/lib/supabase';
import type { SubscriptionTier, Workout, WorkoutCategory } from '@/types/content';

export interface ListWorkoutsFilters {
  search?: string;
  category?: WorkoutCategory;
  minTier?: SubscriptionTier;
  includeDeleted?: boolean;
  offset: number;
  limit: number;
}

export interface ListWorkoutsResult {
  rows: Workout[];
  total: number;
}

export async function listWorkouts(filters: ListWorkoutsFilters): Promise<ListWorkoutsResult> {
  let query = supabase
    .from('workouts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (!filters.includeDeleted) {
    query = query.is('deleted_at', null);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.minTier) {
    query = query.eq('min_tier', filters.minTier);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[,()]/g, ' ').replace(/\s+/g, '%');
    const pattern = `%${escaped}%`;
    query = query.or(`title.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Workout[], total: count ?? 0 };
}
