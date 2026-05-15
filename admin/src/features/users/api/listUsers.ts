import { supabase } from '@/lib/supabase';
import type { Profile, SubscriptionTier } from '@/types/shared';

export type UserListRow = Pick<
  Profile,
  | 'id'
  | 'display_name'
  | 'subscription_tier'
  | 'subscription_status'
  | 'subscription_expires_at'
  | 'subscription_will_renew'
  | 'is_admin'
  | 'created_at'
  | 'email'
>;

export interface ListUsersFilters {
  tier?: SubscriptionTier | 'all';
  search?: string;
  offset: number;
  limit: number;
}

export interface ListUsersResult {
  rows: UserListRow[];
  total: number;
}

export async function listUsers(filters: ListUsersFilters): Promise<ListUsersResult> {
  let query = supabase
    .from('profiles')
    .select(
      'id, email, display_name, subscription_tier, subscription_status, subscription_expires_at, subscription_will_renew, is_admin, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.tier && filters.tier !== 'all') {
    query = query.eq('subscription_tier', filters.tier);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[,()]/g, ' ').replace(/\s+/g, '%');
    const pattern = `%${escaped}%`;
    query = query.or(`email.ilike.${pattern},display_name.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as UserListRow[],
    total: count ?? 0,
  };
}
