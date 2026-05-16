import { supabase } from '@/lib/supabase';
import type { Food } from '@/types/content';

export interface ListFoodsFilters {
  search?: string;
  includeDeleted?: boolean;
  offset: number;
  limit: number;
}

export interface ListFoodsResult {
  rows: Food[];
  total: number;
}

export async function listFoods(filters: ListFoodsFilters): Promise<ListFoodsResult> {
  let query = supabase
    .from('foods')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (!filters.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[,()]/g, ' ').replace(/\s+/g, '%');
    const pattern = `%${escaped}%`;
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern},brand.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []) as Food[],
    total: count ?? 0,
  };
}
