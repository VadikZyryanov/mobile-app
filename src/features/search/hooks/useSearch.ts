import { useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/queryKeys';

import { searchContent } from '../api/searchContent';

export function useSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: qk.search.query(trimmed),
    queryFn: () => searchContent(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60 * 1000,
  });
}
