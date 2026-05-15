-- =========================================================
-- Iteration 6a — Admin access: profile email mirror, audit log,
-- admin RLS policies on profiles, override RPC
-- =========================================================

-- 1. PROFILES — зеркалим email из auth.users (anon-key не видит auth схему)
alter table public.profiles
  add column email text,
  add column subscription_override_note text;

-- Заполняем email для существующих профилей
update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id;

create index profiles_email_idx on public.profiles (email);

-- Обновляем handle_new_user — пишет email при insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end $$;

-- 2. ADMIN AUDIT LOG ---------------------------------------
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  before jsonb,
  after jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index admin_audit_log_target_idx
  on public.admin_audit_log (target_user_id, created_at desc);
create index admin_audit_log_admin_idx
  on public.admin_audit_log (admin_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- SELECT только для админа
create policy "audit_admin_select" on public.admin_audit_log
  for select using (public.is_admin());

-- INSERT-политики нет: записи добавляются исключительно через SECURITY DEFINER функцию

-- 3. ADMIN RLS на profiles (параллельные с existing own-policies)
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 4. RPC: атомарный override подписки + запись в audit log
create or replace function public.admin_override_subscription(
  p_user_id uuid,
  p_tier subscription_tier_enum,
  p_status subscription_status_enum,
  p_expires_at timestamptz,
  p_will_renew boolean,
  p_note text
)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  v_admin_id uuid := auth.uid();
  v_before jsonb;
  v_after public.profiles;
begin
  -- Гард: только админ
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Снимок до
  select to_jsonb(p.*) into v_before
    from public.profiles p
    where p.id = p_user_id;

  if v_before is null then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  -- Обновление
  update public.profiles set
    subscription_tier          = p_tier,
    subscription_status        = p_status,
    subscription_expires_at    = p_expires_at,
    subscription_will_renew    = coalesce(p_will_renew, false),
    subscription_override_note = p_note,
    subscription_updated_at    = now()
  where id = p_user_id
  returning * into v_after;

  insert into public.admin_audit_log (admin_id, action, target_user_id, before, after, note)
    values (v_admin_id, 'subscription_override', p_user_id, v_before, to_jsonb(v_after), p_note);

  return v_after;
end;
$$;

grant execute on function public.admin_override_subscription(
  uuid, subscription_tier_enum, subscription_status_enum, timestamptz, boolean, text
) to authenticated;
