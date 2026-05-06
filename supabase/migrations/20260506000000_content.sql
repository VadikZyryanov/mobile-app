-- =========================================================
-- Iteration 2 — content schema
-- =========================================================

-- ENUMS ---------------------------------------------------
create type subscription_tier_enum as enum ('free', 'basic', 'pro', 'pro_max');
create type workout_category_enum as enum ('upper', 'lower', 'full_body', 'cardio', 'core');
create type muscle_group_enum as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardio'
);

-- PROFILES extension --------------------------------------
alter table public.profiles
  add column subscription_tier subscription_tier_enum not null default 'free',
  add column is_admin boolean not null default false;

-- ADMIN HELPER --------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to authenticated;

-- EXERCISES -----------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  primary_muscle muscle_group_enum not null,
  secondary_muscles muscle_group_enum[] not null default '{}',
  equipment text[] not null default '{}',
  gif_path text,
  video_path text,
  min_tier subscription_tier_enum not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger exercises_set_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();
create index exercises_primary_muscle_idx on public.exercises(primary_muscle);
create index exercises_min_tier_idx on public.exercises(min_tier);

-- WORKOUTS ------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category workout_category_enum not null,
  cover_path text,
  duration_minutes int not null check (duration_minutes > 0),
  difficulty int not null check (difficulty between 1 and 5),
  min_tier subscription_tier_enum not null default 'basic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger workouts_set_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();
create index workouts_category_idx on public.workouts(category);
create index workouts_min_tier_idx on public.workouts(min_tier);

-- WORKOUT_EXERCISES ---------------------------------------
create table public.workout_exercises (
  workout_id uuid not null references public.workouts(id) on delete cascade,
  position int not null check (position > 0),
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sets int not null check (sets > 0),
  reps text not null,
  rest_seconds int not null check (rest_seconds >= 0),
  notes text,
  primary key (workout_id, position)
);
create index workout_exercises_exercise_idx on public.workout_exercises(exercise_id);

-- PROGRAMS ------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_path text,
  weeks int not null check (weeks > 0),
  sessions_per_week int not null check (sessions_per_week between 1 and 7),
  difficulty int not null check (difficulty between 1 and 5),
  min_tier subscription_tier_enum not null default 'pro',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger programs_set_updated_at before update on public.programs
  for each row execute function public.set_updated_at();
create index programs_min_tier_idx on public.programs(min_tier);

-- PROGRAM_WORKOUTS ----------------------------------------
create table public.program_workouts (
  program_id uuid not null references public.programs(id) on delete cascade,
  week int not null check (week > 0),
  day_of_week int not null check (day_of_week between 1 and 7),
  workout_id uuid not null references public.workouts(id) on delete restrict,
  primary key (program_id, week, day_of_week)
);
create index program_workouts_workout_idx on public.program_workouts(workout_id);

-- BLOG_POSTS ----------------------------------------------
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  cover_path text,
  author_id uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger blog_posts_set_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();
create index blog_posts_published_at_idx on public.blog_posts(published_at desc nulls last);

-- RLS -----------------------------------------------------
alter table public.exercises          enable row level security;
alter table public.workouts           enable row level security;
alter table public.workout_exercises  enable row level security;
alter table public.programs           enable row level security;
alter table public.program_workouts   enable row level security;
alter table public.blog_posts         enable row level security;

create policy "exercises_read"  on public.exercises          for select using (auth.role() = 'authenticated');
create policy "exercises_write" on public.exercises          for all    using (public.is_admin()) with check (public.is_admin());

create policy "workouts_read"   on public.workouts           for select using (auth.role() = 'authenticated');
create policy "workouts_write"  on public.workouts           for all    using (public.is_admin()) with check (public.is_admin());

create policy "we_read"         on public.workout_exercises  for select using (auth.role() = 'authenticated');
create policy "we_write"        on public.workout_exercises  for all    using (public.is_admin()) with check (public.is_admin());

create policy "programs_read"   on public.programs           for select using (auth.role() = 'authenticated');
create policy "programs_write"  on public.programs           for all    using (public.is_admin()) with check (public.is_admin());

create policy "pw_read"         on public.program_workouts   for select using (auth.role() = 'authenticated');
create policy "pw_write"        on public.program_workouts   for all    using (public.is_admin()) with check (public.is_admin());

create policy "blog_read" on public.blog_posts for select
  using ((auth.role() = 'authenticated' and published_at is not null) or public.is_admin());
create policy "blog_write" on public.blog_posts for all
  using (public.is_admin()) with check (public.is_admin());

-- RPC: signed URL для приватного видео ---------------------
create or replace function public.get_exercise_video_url(exercise_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare
  ex record; user_tier subscription_tier_enum; signed text;
begin
  select * into ex from public.exercises where slug = exercise_slug;
  if ex is null then raise exception 'exercise not found'; end if;
  if ex.video_path is null then return null; end if;

  select subscription_tier into user_tier from public.profiles where id = auth.uid();
  if user_tier is null then raise exception 'profile not found'; end if;

  if array_position(array['free','basic','pro','pro_max']::text[], user_tier::text)
   < array_position(array['free','basic','pro','pro_max']::text[], ex.min_tier::text) then
    raise exception 'subscription required';
  end if;

  select (storage.create_signed_url('exercise-media', ex.video_path, 3600)).signed_url into signed;
  return signed;
end;
$$;
grant execute on function public.get_exercise_video_url(text) to authenticated;

-- RPC: GIF превью (без tier-проверки — превью всем) -------
create or replace function public.get_exercise_gif_url(exercise_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare
  gif text; signed text;
begin
  select gif_path into gif from public.exercises where slug = exercise_slug;
  if gif is null then return null; end if;
  select (storage.create_signed_url('exercise-media', gif, 3600)).signed_url into signed;
  return signed;
end;
$$;
grant execute on function public.get_exercise_gif_url(text) to authenticated;
