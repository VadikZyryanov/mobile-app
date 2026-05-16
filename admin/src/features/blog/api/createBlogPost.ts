import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { BlogPost, BlogPostInsert } from '@/types/content';

export type BlogPostCreateInput = Omit<BlogPostInsert, 'author_id'>;

export async function createBlogPost(input: BlogPostCreateInput): Promise<BlogPost> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Не авторизован');

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({ ...input, author_id: user.id })
    .select('*')
    .single();
  if (error) throw error;
  const row = data as BlogPost;
  await logAdminAction('create', 'blog_post', row.id, null, row);
  return row;
}
