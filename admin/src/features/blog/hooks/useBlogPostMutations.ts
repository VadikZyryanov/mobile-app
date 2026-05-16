import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { createBlogPost, type BlogPostCreateInput } from '../api/createBlogPost';
import { updateBlogPost } from '../api/updateBlogPost';
import { deleteBlogPost } from '../api/deleteBlogPost';
import type { BlogPostUpdate } from '@/types/content';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.blogPosts.all });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BlogPostCreateInput) => createBlogPost(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: BlogPostUpdate }) => updateBlogPost(id, patch),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => invalidate(qc),
  });
}
