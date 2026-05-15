import { supabase } from '@/lib/supabase';
import type { Profile, SubscriptionStatus, SubscriptionTier } from '@/types/shared';

export interface OverrideSubscriptionInput {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  willRenew: boolean;
  note: string;
}

export async function overrideSubscription(input: OverrideSubscriptionInput): Promise<Profile> {
  const { data, error } = await supabase.rpc('admin_override_subscription', {
    p_user_id: input.userId,
    p_tier: input.tier,
    p_status: input.status,
    p_expires_at: input.expiresAt ?? '',
    p_will_renew: input.willRenew,
    p_note: input.note,
  });
  if (error) throw error;
  return data as Profile;
}
