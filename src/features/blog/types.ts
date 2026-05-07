import type { Database } from '@/lib/database.types';

export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
