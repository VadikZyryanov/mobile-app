import { supabase } from '@/lib/supabase';

import type { SearchResult } from '../types';

export async function searchContent(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const { data, error } = await supabase.rpc('search_content', { q: trimmed });
  if (error) throw error;
  return (data ?? []) as SearchResult[];
}
