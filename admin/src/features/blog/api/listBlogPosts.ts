import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/types/content';

export type BlogPostListRow = BlogPost & {
  author: { id: string; display_name: string | null; email: string | null } | null;
};

export interface ListBlogPostsFilters {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  offset: number;
  limit: number;
}

export interface ListBlogPostsResult {
  rows: BlogPostListRow[];
  total: number;
}

export async function listBlogPosts(filters: ListBlogPostsFilters): Promise<ListBlogPostsResult> {
  let query = supabase
    .from('blog_posts')
    .select('*, author:profiles!blog_posts_author_id_fkey(id, display_name, email)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.status === 'published') {
    query = query.not('published_at', 'is', null);
  } else if (filters.status === 'draft') {
    query = query.is('published_at', null);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[,()]/g, ' ').replace(/\s+/g, '%');
    const pattern = `%${escaped}%`;
    query = query.or(`title.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as BlogPostListRow[],
    total: count ?? 0,
  };
}
