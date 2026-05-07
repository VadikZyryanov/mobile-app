import { supabase } from '@/lib/supabase';

import type { BlogPost } from '../types';

export async function getPostBySlug(slug: string): Promise<BlogPost> {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}
