import type { Database } from '@shared/lib/database.types';

export type { Database };

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type SubscriptionTier = Database['public']['Enums']['subscription_tier_enum'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status_enum'];

export type AdminAuditLogRow = Database['public']['Tables']['admin_audit_log']['Row'];

export const TIERS = [
  'free',
  'basic',
  'pro',
  'pro_max',
] as const satisfies readonly SubscriptionTier[];
export const STATUSES = [
  'active',
  'in_grace_period',
  'in_billing_retry',
  'paused',
  'expired',
  'cancelled',
  'unknown',
] as const satisfies readonly SubscriptionStatus[];

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  pro_max: 'Pro Max',
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Активна',
  in_grace_period: 'Grace period',
  in_billing_retry: 'Billing retry',
  paused: 'Приостановлена',
  expired: 'Истекла',
  cancelled: 'Отменена',
  unknown: 'Неизвестно',
};
