import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import { deleteFile } from '@/lib/storage';
import type { BlogPost } from '@/types/content';

export async function deleteBlogPost(id: string): Promise<void> {
  const { data: before, error: beforeErr } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw error;

  await logAdminAction('delete', 'blog_post', id, before as BlogPost, null);

  const coverPath = (before as BlogPost)?.cover_path;
  if (coverPath) {
    await deleteFile('blog-media', coverPath).catch(() => undefined);
  }
}
