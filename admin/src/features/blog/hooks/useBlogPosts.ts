import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { qk, type BlogPostsListFilters } from '@/lib/queryKeys';
import { listBlogPosts } from '../api/listBlogPosts';

export function useBlogPosts(filters: BlogPostsListFilters) {
  return useQuery({
    queryKey: qk.blogPosts.list(filters),
    queryFn: () => listBlogPosts(filters),
    placeholderData: keepPreviousData,
  });
}
