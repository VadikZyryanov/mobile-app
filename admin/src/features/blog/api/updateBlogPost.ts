import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { BlogPost, BlogPostUpdate } from '@/types/content';

export async function updateBlogPost(id: string, patch: BlogPostUpdate): Promise<BlogPost> {
  const { data: before, error: beforeErr } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { data, error } = await supabase
    .from('blog_posts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const after = data as BlogPost;
  await logAdminAction('update', 'blog_post', id, before, after);
  return after;
}
