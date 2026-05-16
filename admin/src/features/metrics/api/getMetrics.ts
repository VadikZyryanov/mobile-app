import { supabase } from '@/lib/supabase';

export interface RegistrationDay {
  day: string;
  new_users: number;
}
export interface SubscriptionEventDay {
  day: string;
  event_type: string;
  count: number;
}
export interface TierCount {
  tier: string;
  count: number;
}
export interface ContentStats {
  exercises_count: number;
  workouts_count: number;
  programs_count: number;
  blog_posts_count: number;
  foods_count: number;
  total_users: number;
}

export async function getRegistrationsDaily(days: number): Promise<RegistrationDay[]> {
  const { data, error } = await supabase.rpc('admin_get_registrations_daily', { p_days: days });
  if (error) throw error;
  return (data ?? []) as RegistrationDay[];
}

export async function getSubscriptionEventsDaily(days: number): Promise<SubscriptionEventDay[]> {
  const { data, error } = await supabase.rpc('admin_get_subscription_events_daily', {
    p_days: days,
  });
  if (error) throw error;
  return (data ?? []) as SubscriptionEventDay[];
}

export async function getTierDistribution(): Promise<TierCount[]> {
  const { data, error } = await supabase.rpc('admin_get_tier_distribution');
  if (error) throw error;
  return (data ?? []) as TierCount[];
}

export async function getActiveSubs(): Promise<TierCount[]> {
  const { data, error } = await supabase.rpc('admin_get_active_subs');
  if (error) throw error;
  return (data ?? []) as TierCount[];
}

export async function getContentStats(): Promise<ContentStats> {
  const { data, error } = await supabase.rpc('admin_get_content_stats');
  if (error) throw error;
  const rows = (data ?? []) as ContentStats[];
  return rows[0]!;
}
