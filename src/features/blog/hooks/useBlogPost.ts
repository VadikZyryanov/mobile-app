import { useQuery } from '@tanstack/react-query';

import { qk } from '@/lib/queryKeys';

import { getPostBySlug } from '../api/getPostBySlug';

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: qk.blog.detail(slug ?? ''),
    queryFn: () => getPostBySlug(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
