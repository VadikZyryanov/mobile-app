-- =========================================================
-- Iteration 5 — Pro Max: nutrition tracking
-- =========================================================

-- ENUMS ---------------------------------------------------
create type sex_enum as enum ('male', 'female');
create type activity_level_enum as enum
  ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type weight_goal_enum as enum ('lose', 'maintain', 'gain');
create type meal_type_enum as enum ('breakfast', 'lunch', 'dinner', 'snack');

-- PROFILES extension (физ. параметры + manual KBJU override) ---
alter table public.profiles
  add column sex sex_enum,
  add column birth_date date,
  add column height_cm int check (height_cm between 100 and 250),
  add column weight_kg numeric(5,2) check (weight_kg between 30 and 300),
  add column activity_level activity_level_enum,
  add column weight_goal weight_goal_enum,
  add column kcal_target int check (kcal_target is null or kcal_target between 800 and 6000),
  add column protein_g_target int check (protein_g_target is null or protein_g_target >= 0),
  add column fat_g_target int check (fat_g_target is null or fat_g_target >= 0),
  add column carbs_g_target int check (carbs_g_target is null or carbs_g_target >= 0);

-- FOODS (admin-managed) -----------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text,
  kcal_per_100g numeric(6,2) not null check (kcal_per_100g >= 0),
  protein_per_100g numeric(6,2) not null check (protein_per_100g >= 0),
  fat_per_100g numeric(6,2) not null check (fat_per_100g >= 0),
  carbs_per_100g numeric(6,2) not null check (carbs_per_100g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger foods_set_updated_at before update on public.foods
  for each row execute function public.set_updated_at();
create index foods_name_lower_idx on public.foods (lower(name));

alter table public.foods enable row level security;
create policy "foods_read" on public.foods for select using (auth.role() = 'authenticated');
create policy "foods_write" on public.foods for all
  using (public.is_admin()) with check (public.is_admin());

-- NUTRITION ENTRIES ---------------------------------------
create table public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  meal_type meal_type_enum not null,
  quantity_grams numeric(7,2) not null check (quantity_grams > 0 and quantity_grams <= 5000),
  consumed_on date not null default current_date,
  consumed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index nutrition_entries_user_day_idx
  on public.nutrition_entries (user_id, consumed_on desc, consumed_at desc);

alter table public.nutrition_entries enable row level security;

-- Pro Max gate серверной стороны
create or replace function public.has_pro_max_access()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select subscription_tier = 'pro_max' from public.profiles where id = auth.uid()),
    false
  );
$$;
grant execute on function public.has_pro_max_access() to authenticated;

create policy "ne_select_own"
  on public.nutrition_entries for select
  using (auth.uid() = user_id);

create policy "ne_insert_own_promax"
  on public.nutrition_entries for insert
  with check (auth.uid() = user_id and public.has_pro_max_access());

create policy "ne_update_own_promax"
  on public.nutrition_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.has_pro_max_access());

create policy "ne_delete_own"
  on public.nutrition_entries for delete
  using (auth.uid() = user_id);
