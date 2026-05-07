import { supabase } from '@/lib/supabase';

import type { BlogPost } from '../types';

export async function listPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
