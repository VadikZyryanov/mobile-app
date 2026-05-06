-- FTS columns + GIN indexes -------------------------------
alter table public.exercises
  add column search_tsv tsvector generated always as (
    setweight(to_tsvector('russian', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('russian', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('russian', primary_muscle::text), 'C')
  ) stored;
create index exercises_search_idx on public.exercises using gin(search_tsv);

alter table public.workouts
  add column search_tsv tsvector generated always as (
    setweight(to_tsvector('russian', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('russian', coalesce(description,'')), 'B')
  ) stored;
create index workouts_search_idx on public.workouts using gin(search_tsv);

-- Unified search RPC --------------------------------------
create or replace function public.search_content(q text)
returns table (
  kind text, id uuid, slug text, title text, subtitle text,
  cover_path text, min_tier subscription_tier_enum, rank real
)
language sql stable security invoker set search_path = public as $$
  with query as (select plainto_tsquery('russian', q) as tsq)
  select 'exercise', e.id, e.slug, e.name, e.primary_muscle::text, e.gif_path,
         e.min_tier, ts_rank(e.search_tsv, query.tsq)
  from public.exercises e, query where e.search_tsv @@ query.tsq
  union all
  select 'workout', w.id, w.slug, w.title, w.category::text, w.cover_path,
         w.min_tier, ts_rank(w.search_tsv, query.tsq)
  from public.workouts w, query where w.search_tsv @@ query.tsq
  order by rank desc limit 30;
$$;
grant execute on function public.search_content(text) to authenticated;
