import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/types/content';

export async function getBlogPostById(id: string): Promise<BlogPost> {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();
  if (error) throw error;
  return data as BlogPost;
}
