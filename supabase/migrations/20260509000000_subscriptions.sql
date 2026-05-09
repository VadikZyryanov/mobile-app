-- =========================================================
-- Iteration 3 — RevenueCat subscription metadata
-- =========================================================

-- ENUM ----------------------------------------------------
create type subscription_status_enum as enum (
  'active',
  'in_grace_period',
  'in_billing_retry',
  'paused',
  'expired',
  'cancelled',
  'unknown'
);

-- PROFILES extension --------------------------------------
alter table public.profiles
  add column revenuecat_app_user_id text unique,
  add column subscription_status subscription_status_enum not null default 'unknown',
  add column subscription_product_id text,
  add column subscription_expires_at timestamptz,
  add column subscription_will_renew boolean not null default false,
  add column subscription_updated_at timestamptz;

-- SUBSCRIPTION EVENTS LOG (idempotency + audit) -----------
create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  app_user_id text not null,
  product_id text,
  entitlement_id text,
  expires_at timestamptz,
  raw_payload jsonb not null,
  processed_at timestamptz not null default now()
);

create index subscription_events_app_user_id_idx
  on public.subscription_events (app_user_id);
create index subscription_events_processed_at_idx
  on public.subscription_events (processed_at desc);

-- RLS: только service_role пишет/читает
alter table public.subscription_events enable row level security;

-- HELPER RPC ----------------------------------------------
-- Клиент дёргает после покупки для быстрого обновления tier
-- (на случай задержки webhook). Идемпотентно.
create or replace function public.refresh_my_subscription_tier()
returns subscription_tier_enum
language plpgsql security definer set search_path = public as $$
declare
  v_tier subscription_tier_enum;
begin
  select subscription_tier into v_tier
  from public.profiles where id = auth.uid();
  return coalesce(v_tier, 'free');
end;
$$;

grant execute on function public.refresh_my_subscription_tier() to authenticated;
