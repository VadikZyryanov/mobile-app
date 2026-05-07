import { useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/queryKeys';

import { listPublishedPosts } from '../api/listPublishedPosts';

export function useBlogPosts() {
  return useQuery({
    queryKey: qk.blog.list(),
    queryFn: listPublishedPosts,
    staleTime: 2 * 60 * 1000,
  });
}
