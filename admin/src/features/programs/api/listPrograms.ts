import { supabase } from '@/lib/supabase';
import type { Program, SubscriptionTier } from '@/types/content';

export interface ListProgramsFilters {
  search?: string;
  minTier?: SubscriptionTier;
  difficulty?: number;
  offset: number;
  limit: number;
}

export interface ListProgramsResult {
  rows: Program[];
  total: number;
}

export async function listPrograms(filters: ListProgramsFilters): Promise<ListProgramsResult> {
  let query = supabase
    .from('programs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.minTier) {
    query = query.eq('min_tier', filters.minTier);
  }
  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[,()]/g, ' ').replace(/\s+/g, '%');
    const pattern = `%${escaped}%`;
    query = query.or(`title.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Program[], total: count ?? 0 };
}
