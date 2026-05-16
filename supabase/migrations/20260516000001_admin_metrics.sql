-- supabase/migrations/20260516000001_admin_metrics.sql

-- ─── Метрики: ежедневные регистрации ───────────────────────────────────────
create or replace function public.admin_get_registrations_daily(p_days int default 30)
returns table(day date, new_users int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      date_trunc('day', created_at)::date as day,
      count(*)::int as new_users
    from public.profiles
    where created_at >= now() - (p_days || ' days')::interval
    group by 1
    order by 1;
end;
$$;

-- ─── Метрики: ежедневные события подписок ─────────────────────────────────
create or replace function public.admin_get_subscription_events_daily(p_days int default 30)
returns table(day date, event_type text, count int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      date_trunc('day', processed_at)::date as day,
      se.event_type,
      count(*)::int
    from public.subscription_events se
    where processed_at >= now() - (p_days || ' days')::interval
    group by 1, 2
    order by 1, 2;
end;
$$;

-- ─── Метрики: распределение по тирам ──────────────────────────────────────
create or replace function public.admin_get_tier_distribution()
returns table(tier text, count int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.subscription_tier::text, count(*)::int
    from public.profiles p
    group by p.subscription_tier;
end;
$$;

-- ─── Метрики: активные подписки по тиру (для est. MRR) ───────────────────
create or replace function public.admin_get_active_subs()
returns table(tier text, count int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.subscription_tier::text, count(*)::int
    from public.profiles p
    where p.subscription_status in ('active', 'in_grace_period')
      and p.subscription_tier <> 'free'
    group by p.subscription_tier;
end;
$$;

-- ─── Метрики: статистика контента ─────────────────────────────────────────
create or replace function public.admin_get_content_stats()
returns table(
  exercises_count int,
  workouts_count  int,
  programs_count  int,
  blog_posts_count int,
  foods_count     int,
  total_users     int
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      (select count(*) from public.exercises  where deleted_at is null)::int,
      (select count(*) from public.workouts   where deleted_at is null)::int,
      (select count(*) from public.programs)::int,
      (select count(*) from public.blog_posts)::int,
      (select count(*) from public.foods      where deleted_at is null)::int,
      (select count(*) from public.profiles)::int;
end;
$$;

-- Grants
grant execute on function public.admin_get_registrations_daily(int)        to authenticated;
grant execute on function public.admin_get_subscription_events_daily(int)   to authenticated;
grant execute on function public.admin_get_tier_distribution()              to authenticated;
grant execute on function public.admin_get_active_subs()                    to authenticated;
grant execute on function public.admin_get_content_stats()                  to authenticated;
