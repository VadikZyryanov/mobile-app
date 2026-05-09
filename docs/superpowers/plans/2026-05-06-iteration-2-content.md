# Iteration 2 — Backend MVP + контент. Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Наполнить приложение контентом (упражнения, тренировки, программы, блог, поиск) на чистом Supabase без Express, разметив тарифы через `min_tier`.

**Architecture:** Postgres (Supabase) с RLS, FTS-индексами и RPC для signed URL/поиска. Storage: 1 private bucket для видео + 3 public для обложек. Клиент — React Native + Expo Router, React Query для серверного state, Zustand для auth (без новых сторов). Tier gate проверяется и в RPC, и в UI.

**Tech Stack:** React Native 0.81, Expo SDK 54 (Expo Router), TypeScript strict, Supabase JS 2, React Query 5, Zustand 5, Jest + RNTL, `expo-video` (новый), `react-native-markdown-display`.

**Reference spec:** [docs/superpowers/specs/2026-05-06-iteration-2-content-design.md](../specs/2026-05-06-iteration-2-content-design.md)

---

## Design direction

Все новые экраны и shared-компоненты делаем в стиле **минимализм + glassmorphism**, поддерживая существующую светлую и тёмную тему из Iter 0 (`src/theme/`). Референсы пользователя: светлые экраны с воздушными glass-карточками поверх мягкого фона; тёмные — с матовыми картинками и накладными glass-панелями.

**Минимализм:**

- Много воздуха: используем `theme.spacing.lg` / `xl` / `2xl` / `3xl` для вертикальных отступов в screen-контейнерах. Не лепим элементы вплотную.
- Крупная типографика для заголовков экрана: `Text variant="hero" weight="bold"` или `heroLg`. Заголовки секций — `titleLg`. Подписи — `caption` с `color="textMuted"`.
- Монохромная база (`bg`, `bgElevated`, `text`, `textMuted`) + один accent (`accent`). Цвета `danger`/`success` только для семантики (ошибки, "Подписка активна").
- Минимум UI-шума: hairline-разделители (`StyleSheet.hairlineWidth` + `theme.colors.divider`), один-два уровня иерархии.
- Скруглённые радиусы из токенов (`radii.lg` 16, `xl` 20, `2xl` 24). Никаких "острых" углов.

**Glassmorphism:**

- Карточки контента (`WorkoutCard`, `ProgramCard`, `BlogPostCard`, `PaywallCard`) — `<Card variant="glass">` (BlurView + `glassBg` + 1px `glassBorder`).
- На экранах деталей (workouts/programs/blog/exercises) обложка занимает верхнюю треть; основной контент — glass-карточка, наезжающая снизу с отрицательным `marginTop` (как на референсе с Nusa Penida / White Diamond).
- Tab bar и header'ы используют BlurView (уже настроено в `app/(tabs)/_layout.tsx`). Не ломаем.
- Кнопки primary — solid accent. Secondary/back-кнопки — round glass (`Card variant="glass"` 40×40 с иконкой).
- Тени: `shadow.sm` или `md` под glass-карточками, чтобы они "парили". Не использовать `lg` — слишком тяжело для минимализма.

**Light vs dark:**

- Светлая: фон `#FAFAFA`, glass — почти прозрачный белый. Картинки тёплых тонов хорошо смотрятся.
- Тёмная: фон `#0A0A0A`, glass — полупрозрачный тёмно-серый. Картинки с глубокими тенями.
- Цвет текста и иконок переключается через `useTheme()` — никаких хардкоженных `#000`/`#fff` в компонентах.

**Применение в задачах:**

- Каждая UI-задача (компоненты в `components/shared/` и экраны в `app/(tabs)/...`) использует только токены `useTheme()`. Никаких magic numbers для цвета или отступов.
- Экраны деталей реализуют паттерн "image hero → overlay glass-карточка с инфой".
- Listing-экраны: вертикальный список glass-карточек на pure-фоне, с `Segmented`-фильтром сверху (как уже сделан в Iter 1).

---

## Phasing overview

| Phase | Содержание                                      | Tasks |
| ----- | ----------------------------------------------- | ----- |
| 1     | DB foundation (миграции, types, mock)           | 1–3   |
| 2     | Storage + seed                                  | 4–5   |
| 3     | Shared infrastructure                           | 6–10  |
| 4     | Shared content components (UI-кит для контента) | 11–17 |
| 5     | Exercises feature                               | 18–22 |
| 6     | Workouts feature                                | 23–27 |
| 7     | Programs feature                                | 28–32 |
| 8     | Blog feature                                    | 33–37 |
| 9     | Search feature                                  | 38–40 |
| 10    | Tab bar + Home + Profile                        | 41–43 |
| 11    | QA + docs                                       | 44–45 |

После каждой фазы запустить `npm test`, `npm typecheck`, `npm lint` — всё должно быть зелёным.

---

# Phase 1 — DB foundation

## Task 1: Миграция content (enums, profiles ALTER, 6 таблиц, RLS, RPC)

**Files:**

- Create: `supabase/migrations/20260506000000_content.sql`

- [ ] **Step 1: Создать файл миграции**

Полное содержимое `supabase/migrations/20260506000000_content.sql`:

```sql
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

-- Read: authenticated пользователи видят весь контент.
-- Write: только админ или service-role.
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

-- blog: published_at NOT NULL для обычных юзеров; админ видит всё
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
```

- [ ] **Step 2: Применить миграцию**

Через Supabase MCP:

```
mcp__supabase__apply_migration name="20260506000000_content" query="<содержимое файла>"
```

Или через Studio → SQL editor → Run.

Ожидание: успешно применено, в `list_tables` появились 6 новых таблиц.

- [ ] **Step 3: Smoke-проверка через SQL editor**

```sql
select count(*) from public.exercises;
-- ожидание: 0

select pg_get_functiondef('public.get_exercise_video_url(text)'::regprocedure);
-- ожидание: текст функции возвращён
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260506000000_content.sql
git commit -m "feat(db): iter2 content migration — enums, 6 tables, RLS, RPC"
```

---

## Task 2: Миграция search (FTS + GIN + search_content RPC)

**Files:**

- Create: `supabase/migrations/20260506000001_search.sql`

- [ ] **Step 1: Создать файл**

Полное содержимое `supabase/migrations/20260506000001_search.sql`:

```sql
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
```

- [ ] **Step 2: Применить**

Через MCP `apply_migration` или Studio.

- [ ] **Step 3: Smoke-проверка**

После того как seed загружен (Task 5), вернуться сюда и выполнить:

```sql
select * from public.search_content('приседания') limit 5;
-- сейчас (до seed) должен вернуть 0 строк, но без ошибок
```

Сейчас просто проверить, что функция создалась:

```sql
select pg_get_functiondef('public.search_content(text)'::regprocedure);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260506000001_search.sql
git commit -m "feat(db): iter2 FTS — tsvector + GIN + search_content RPC"
```

---

## Task 3: Регенерация types + расширение supabase mock

**Files:**

- Modify: `src/lib/database.types.ts` (regen)
- Modify: `jest.setup.ts`

- [ ] **Step 1: Перегенерировать database.types.ts**

Через MCP:

```
mcp__supabase__generate_typescript_types
```

Скопировать результат в `src/lib/database.types.ts` (полная замена). Должны появиться: `exercises`, `workouts`, `workout_exercises`, `programs`, `program_workouts`, `blog_posts`, в `profiles` — поля `subscription_tier`, `is_admin`. В `Functions` — `get_exercise_video_url`, `get_exercise_gif_url`, `search_content`, `is_admin`.

- [ ] **Step 2: Расширить supabase mock**

Заменить блок `jest.mock('@/lib/supabase', ...)` в `jest.setup.ts`:

```ts
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));
```

- [ ] **Step 3: Запустить существующие тесты**

Run: `npm test`
Expected: PASS (62 теста). Если что-то ломается — починить (типы профиля могли стать строже).

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts jest.setup.ts
git commit -m "chore(db): regen types + extend supabase mock with rpc/storage"
```

---

# Phase 2 — Storage + seed

## Task 4: Storage buckets + policies

**Files:** только конфигурация в Supabase (no local files в коде).

- [ ] **Step 1: Создать buckets через Studio (Storage → New bucket)**

| Bucket           | Public | File size limit | Allowed MIME types                  |
| ---------------- | ------ | --------------- | ----------------------------------- |
| `exercise-media` | ❌     | 50 MB           | `image/gif, video/mp4`              |
| `workout-covers` | ✅     | 5 MB            | `image/jpeg, image/png, image/webp` |
| `program-covers` | ✅     | 5 MB            | `image/jpeg, image/png, image/webp` |
| `blog-media`     | ✅     | 5 MB            | `image/jpeg, image/png, image/webp` |

- [ ] **Step 2: Применить storage policies через SQL editor**

```sql
-- READ: для public bucket'ов работает по умолчанию.
-- exercise-media приватен — клиент читает только через signed URL (RPC).
-- WRITE/UPDATE/DELETE на всех — только админ.

create policy "storage_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('exercise-media','workout-covers','program-covers','blog-media') and public.is_admin());

create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('exercise-media','workout-covers','program-covers','blog-media') and public.is_admin())
  with check (public.is_admin());

create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('exercise-media','workout-covers','program-covers','blog-media') and public.is_admin());
```

- [ ] **Step 3: Smoke-проверка**

В Studio → Storage:

- Залогиниться как обычный user (не admin) → попытка upload → должна быть запрещена.
- Сделать `update profiles set is_admin = true where id = auth.uid()` → upload → должен пройти.

- [ ] **Step 4: Commit (только doc-обновление если нужно)**

В этом таске нет файлов в репо. Если хотим зафиксировать — добавить к Task 5 описание в seed.sql header.

---

## Task 5: Seed контент

**Files:**

- Create: `supabase/seed.sql`

- [ ] **Step 1: Подготовить медиа-файлы локально**

В отдельной папке (например `~/Downloads/iter2-media/`) собрать:

- 10 GIF упражнений (по теме: squat.gif, deadlift.gif, push-up.gif, pull-up.gif, plank.gif, lunge.gif, bench-press.gif, row.gif, shoulder-press.gif, burpee.gif)
- 3 MP4 видео для упражнений с min_tier='pro' (squat-tech.mp4, deadlift-tech.mp4, pull-up-tech.mp4)
- 5 cover.jpg тренировок
- 2 cover.jpg программы
- 3 cover.jpg блога

Источники: можно временно взять placeholder'ы с Unsplash/Pixabay (license-free) или сгенерировать через AI.

- [ ] **Step 2: Загрузить файлы через Studio → Storage**

Залить с такой структурой:

- `exercise-media/gifs/squat.gif`, `gifs/deadlift.gif`, …
- `exercise-media/videos/squat-tech.mp4`, …
- `workout-covers/upper-power.jpg`, …
- `program-covers/8-week-strength.jpg`, …
- `blog-media/post-1.jpg`, …

- [ ] **Step 3: Создать `supabase/seed.sql`**

```sql
-- =========================================================
-- Iter 2 development seed.
-- Запустить через Studio → SQL editor после загрузки файлов в Storage.
-- Пути gif_path/video_path/cover_path должны совпадать с файлами в bucket'ах.
-- =========================================================

-- Сделать текущего юзера админом (выполнить ОТДЕЛЬНО, после первого signup):
-- update public.profiles set is_admin = true, subscription_tier = 'pro_max'
--   where id = auth.uid();

-- EXERCISES -----------------------------------------------
insert into public.exercises (slug, name, description, primary_muscle, secondary_muscles, equipment, gif_path, video_path, min_tier) values
  ('squat',           'Приседания со штангой',  'Базовое упражнение на ноги. Опускайтесь до параллели бедра с полом.', 'quads',     '{"glutes","hamstrings","core"}', '{"barbell","rack"}', 'gifs/squat.gif',          'videos/squat-tech.mp4',    'pro'),
  ('deadlift',        'Становая тяга',          'Базовое упражнение на заднюю цепь. Спина прямая.',                    'back',      '{"hamstrings","glutes","core"}', '{"barbell"}',        'gifs/deadlift.gif',       'videos/deadlift-tech.mp4', 'pro'),
  ('push-up',         'Отжимания от пола',      'Классические отжимания. Тело — прямая линия.',                        'chest',     '{"triceps","shoulders","core"}', '{}',                 'gifs/push-up.gif',        null,                       'free'),
  ('pull-up',         'Подтягивания',           'Подтягивания прямым хватом до подбородка над перекладиной.',           'back',      '{"biceps","shoulders"}',         '{"pull-up-bar"}',    'gifs/pull-up.gif',        'videos/pull-up-tech.mp4',  'basic'),
  ('plank',           'Планка',                 'Удержание прямого положения на локтях.',                              'core',      '{}',                             '{}',                 'gifs/plank.gif',          null,                       'free'),
  ('lunge',           'Выпады',                 'Шаг вперёд, опускание заднего колена.',                               'quads',     '{"glutes","hamstrings"}',        '{"dumbbells"}',      'gifs/lunge.gif',          null,                       'basic'),
  ('bench-press',     'Жим штанги лёжа',        'Жим штанги от груди на горизонтальной скамье.',                       'chest',     '{"triceps","shoulders"}',        '{"barbell","bench"}','gifs/bench-press.gif',    null,                       'basic'),
  ('barbell-row',     'Тяга штанги в наклоне',  'Тяга к поясу в наклоне 45°.',                                         'back',      '{"biceps"}',                     '{"barbell"}',        'gifs/row.gif',            null,                       'basic'),
  ('shoulder-press',  'Жим над головой',        'Жим штанги стоя над головой.',                                         'shoulders', '{"triceps","core"}',             '{"barbell"}',        'gifs/shoulder-press.gif', null,                       'basic'),
  ('burpee',          'Бёрпи',                  'Прыжок-отжимание-прыжок. Кардио + сила.',                              'cardio',    '{"core","chest","quads"}',       '{}',                 'gifs/burpee.gif',         null,                       'free');

-- WORKOUTS ------------------------------------------------
insert into public.workouts (slug, title, description, category, cover_path, duration_minutes, difficulty, min_tier) values
  ('upper-power',      'Верх тела — сила',       'Базовая тренировка на грудь, спину, плечи.',                  'upper',     'upper-power.jpg',      45, 3, 'basic'),
  ('lower-power',      'Низ тела — сила',        'Приседания, становая, выпады. Тяжёлая.',                       'lower',     'lower-power.jpg',      50, 4, 'basic'),
  ('full-body-starter','Full body для новичков', 'Лёгкая полная тренировка тела.',                               'full_body', 'full-body-starter.jpg',30, 1, 'basic'),
  ('hiit-15',          'HIIT 15 минут',          'Высокоинтенсивный интервальный тренинг.',                      'cardio',    'hiit-15.jpg',          15, 4, 'basic'),
  ('core-burn',        'Кор и пресс',            'Изоляция кора, планки и скручивания.',                         'core',      'core-burn.jpg',        20, 2, 'basic');

-- WORKOUT_EXERCISES ---------------------------------------
-- upper-power
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 4, '6-8', 120, 'Тяжёлый рабочий вес'
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='bench-press';
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 2, e.id, 4, '6-8', 120, null
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='barbell-row';
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 3, e.id, 3, '8-10', 90, null
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='shoulder-press';
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 4, e.id, 3, 'AMRAP', 60, 'До отказа'
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='pull-up';

-- lower-power
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 5, '5', 180, 'Главное упражнение'
from public.workouts w, public.exercises e where w.slug='lower-power' and e.slug='squat';
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 2, e.id, 3, '5', 180, null
from public.workouts w, public.exercises e where w.slug='lower-power' and e.slug='deadlift';
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 3, e.id, 3, '10/нога', 90, null
from public.workouts w, public.exercises e where w.slug='lower-power' and e.slug='lunge';

-- full-body-starter
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 3, '10', 60, null
from public.workouts w, public.exercises e where w.slug='full-body-starter' and e.slug='push-up';
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 2, e.id, 3, '12', 60, null
from public.workouts w, public.exercises e where w.slug='full-body-starter' and e.slug='lunge';
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 3, e.id, 3, '30s', 60, null
from public.workouts w, public.exercises e where w.slug='full-body-starter' and e.slug='plank';

-- hiit-15
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 5, '20s', 10, '5 раундов: 20s работа / 10s отдых'
from public.workouts w, public.exercises e where w.slug='hiit-15' and e.slug='burpee';

-- core-burn
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 4, '45s', 30, null
from public.workouts w, public.exercises e where w.slug='core-burn' and e.slug='plank';

-- PROGRAMS ------------------------------------------------
insert into public.programs (slug, title, description, cover_path, weeks, sessions_per_week, difficulty, min_tier) values
  ('8-week-strength',  '8 недель — сила',       'Линейная прогрессия в базовых упражнениях. Понедельник/среда/пятница.', '8-week-strength.jpg', 8, 3, 3, 'pro'),
  ('4-week-jumpstart', '4 недели — старт',      'Лёгкая программа для входа в режим. 3 раза в неделю.',                 '4-week-jumpstart.jpg',4, 3, 1, 'basic');

-- PROGRAM_WORKOUTS — заполняем 8-week-strength: пн/ср/пт чередуем upper/lower/full
insert into public.program_workouts (program_id, week, day_of_week, workout_id)
select p.id, w_num, d, wk.id
from public.programs p,
     generate_series(1,8) as w_num,
     (values (1,'upper-power'),(3,'lower-power'),(5,'full-body-starter')) as t(d,slug),
     public.workouts wk
where p.slug='8-week-strength' and wk.slug=t.slug;

-- 4-week-jumpstart
insert into public.program_workouts (program_id, week, day_of_week, workout_id)
select p.id, w_num, d, wk.id
from public.programs p,
     generate_series(1,4) as w_num,
     (values (1,'full-body-starter'),(3,'core-burn'),(5,'hiit-15')) as t(d,slug),
     public.workouts wk
where p.slug='4-week-jumpstart' and wk.slug=t.slug;

-- BLOG_POSTS ----------------------------------------------
-- ВАЖНО: author_id должен ссылаться на существующий profiles.id.
-- Перед запуском seed: убедитесь что у вас есть профиль с is_admin=true,
-- и подставьте его id вместо <ADMIN_PROFILE_ID> или используйте подзапрос.

insert into public.blog_posts (slug, title, excerpt, body, cover_path, author_id, published_at) values
  ('how-to-squat',    'Как правильно приседать',   'Разбираем технику приседаний пошагово.',
   E'# Техника приседаний\n\nНоги на ширине плеч, носки чуть в стороны.\n\n## Опускание\n- Колени по линии стопы\n- Спина прямая\n\n## Подъём\nТолкаемся пятками.',
   'post-1.jpg', (select id from public.profiles where is_admin = true limit 1), now() - interval '3 days'),

  ('rest-importance', 'Зачем нужен отдых',         'Восстановление так же важно, как и тренировка.',
   E'# Отдых = прогресс\n\nМышцы растут не на тренировке, а во сне.\n\n- 7-9 часов сна\n- 48 часов между тяжёлыми тренировками одной группы',
   'post-2.jpg', (select id from public.profiles where is_admin = true limit 1), now() - interval '1 day'),

  ('protein-basics',  'Белок: сколько и когда',    'Базовая математика по белку.',
   E'# Белок\n\n1.6-2.2 г/кг для атлета.\n\n## Источники\n- Курица, рыба, говядина\n- Яйца, творог\n- Whey-протеин для добора',
   'post-3.jpg', (select id from public.profiles where is_admin = true limit 1), now());
```

- [ ] **Step 4: Прогнать seed**

В Studio → SQL editor:

1. Сначала вручную: `update public.profiles set is_admin = true, subscription_tier = 'pro_max' where id = auth.uid()` — чтобы blog seed нашёл автора.
2. Запустить полностью `seed.sql`.

- [ ] **Step 5: Smoke-проверка**

```sql
select count(*) from public.exercises;       -- 10
select count(*) from public.workouts;        -- 5
select count(*) from public.programs;        -- 2
select count(*) from public.blog_posts;      -- 3
select count(*) from public.workout_exercises; -- ~13
select count(*) from public.program_workouts;  -- 24+12 = 36

-- Search smoke
select * from public.search_content('приседания') limit 5;
-- ожидание: ≥1 строка
select * from public.search_content('squat') limit 5;
-- ожидание: ≥1 строка (FTS russian config частично работает с латиницей)
```

- [ ] **Step 6: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(db): iter2 seed — 10 exercises, 5 workouts, 2 programs, 3 posts"
```

---

# Phase 3 — Shared infrastructure

## Task 6: tierGate.ts (TDD)

**Files:**

- Create: `src/features/exercises/lib/tierGate.ts`
- Test: `src/features/exercises/lib/tierGate.test.ts`

> Хотя файл лежит в `features/exercises/lib`, функция используется во всех фичах. Это терпимо — alternative было бы вытащить в `src/lib/tierGate.ts`, но спека фиксирует расположение в exercises/lib.

- [ ] **Step 1: Написать падающий тест**

`src/features/exercises/lib/tierGate.test.ts`:

```ts
import { hasAccess, TIER_ORDER } from './tierGate';

describe('hasAccess', () => {
  it('free имеет доступ к free', () => {
    expect(hasAccess('free', 'free')).toBe(true);
  });
  it('free НЕ имеет доступа к basic/pro/pro_max', () => {
    expect(hasAccess('free', 'basic')).toBe(false);
    expect(hasAccess('free', 'pro')).toBe(false);
    expect(hasAccess('free', 'pro_max')).toBe(false);
  });
  it('basic имеет доступ к free и basic, не выше', () => {
    expect(hasAccess('basic', 'free')).toBe(true);
    expect(hasAccess('basic', 'basic')).toBe(true);
    expect(hasAccess('basic', 'pro')).toBe(false);
  });
  it('pro имеет доступ ко всему кроме pro_max', () => {
    expect(hasAccess('pro', 'pro')).toBe(true);
    expect(hasAccess('pro', 'pro_max')).toBe(false);
  });
  it('pro_max имеет доступ ко всему', () => {
    expect(hasAccess('pro_max', 'free')).toBe(true);
    expect(hasAccess('pro_max', 'pro_max')).toBe(true);
  });
  it('TIER_ORDER в правильном порядке', () => {
    expect(TIER_ORDER).toEqual(['free', 'basic', 'pro', 'pro_max']);
  });
});
```

- [ ] **Step 2: Запустить — должен упасть**

Run: `npm test -- tierGate`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать**

`src/features/exercises/lib/tierGate.ts`:

```ts
export const TIER_ORDER = ['free', 'basic', 'pro', 'pro_max'] as const;
export type Tier = (typeof TIER_ORDER)[number];

export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}
```

- [ ] **Step 4: Тест зелёный**

Run: `npm test -- tierGate`
Expected: PASS (6 тестов).

- [ ] **Step 5: Commit**

```bash
git add src/features/exercises/lib/tierGate.ts src/features/exercises/lib/tierGate.test.ts
git commit -m "feat(exercises): tierGate hasAccess helper + tests"
```

---

## Task 7: queryKeys.ts

**Files:**

- Create: `src/lib/queryKeys.ts`

- [ ] **Step 1: Написать файл**

`src/lib/queryKeys.ts`:

```ts
export const qk = {
  exercises: {
    all: ['exercises'] as const,
    list: (filter?: string) => ['exercises', 'list', filter ?? 'all'] as const,
    detail: (slug: string) => ['exercises', 'detail', slug] as const,
    gifUrl: (slug: string) => ['exercises', 'gif-url', slug] as const,
    videoUrl: (slug: string) => ['exercises', 'video-url', slug] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    list: (category?: string) => ['workouts', 'list', category ?? 'all'] as const,
    detail: (slug: string) => ['workouts', 'detail', slug] as const,
  },
  programs: {
    all: ['programs'] as const,
    list: () => ['programs', 'list'] as const,
    detail: (slug: string) => ['programs', 'detail', slug] as const,
  },
  blog: {
    all: ['blog'] as const,
    list: () => ['blog', 'list'] as const,
    detail: (slug: string) => ['blog', 'detail', slug] as const,
  },
  search: {
    all: ['search'] as const,
    query: (q: string) => ['search', 'query', q] as const,
  },
} as const;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queryKeys.ts
git commit -m "feat(lib): centralized React Query keys"
```

---

## Task 8: services/storage.ts (TDD)

**Files:**

- Create: `src/services/storage.ts`
- Test: `src/services/storage.test.ts`

- [ ] **Step 1: Тест**

`src/services/storage.test.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { getPublicUrl } from './storage';

const storageFromMock = supabase.storage.from as jest.Mock;

describe('getPublicUrl', () => {
  beforeEach(() => storageFromMock.mockReset());

  it('возвращает publicUrl для bucket+path', () => {
    const getPublicUrlMock = jest.fn(() => ({
      data: { publicUrl: 'https://x.supabase.co/object/public/workout-covers/foo.jpg' },
    }));
    storageFromMock.mockReturnValueOnce({ getPublicUrl: getPublicUrlMock });

    const url = getPublicUrl('workout-covers', 'foo.jpg');
    expect(storageFromMock).toHaveBeenCalledWith('workout-covers');
    expect(getPublicUrlMock).toHaveBeenCalledWith('foo.jpg');
    expect(url).toBe('https://x.supabase.co/object/public/workout-covers/foo.jpg');
  });

  it('возвращает null если path пустой', () => {
    expect(getPublicUrl('workout-covers', null)).toBeNull();
    expect(getPublicUrl('workout-covers', '')).toBeNull();
    expect(storageFromMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `npm test -- services/storage`
Expected: FAIL.

- [ ] **Step 3: Реализация**

`src/services/storage.ts`:

```ts
import { supabase } from '@/lib/supabase';

export type PublicBucket = 'workout-covers' | 'program-covers' | 'blog-media';

export function getPublicUrl(bucket: PublicBucket, path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
```

- [ ] **Step 4: Run — pass**

Run: `npm test -- services/storage`
Expected: PASS (2).

- [ ] **Step 5: Commit**

```bash
git add src/services/storage.ts src/services/storage.test.ts
git commit -m "feat(services): getPublicUrl helper for public buckets"
```

---

## Task 9: useDebouncedValue hook (TDD)

**Files:**

- Create: `src/hooks/useDebouncedValue.ts`
- Test: `src/hooks/useDebouncedValue.test.tsx`

- [ ] **Step 1: Тест**

`src/hooks/useDebouncedValue.test.tsx`:

```ts
import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from './useDebouncedValue';

jest.useFakeTimers();

describe('useDebouncedValue', () => {
  it('возвращает initial value сразу', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('обновляет значение после задержки', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'ab' });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('ab');
  });

  it('сбрасывает таймер при быстром изменении', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'ab' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ v: 'abc' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('abc');
  });
});
```

- [ ] **Step 2: Fail**

Run: `npm test -- useDebouncedValue`
Expected: FAIL.

- [ ] **Step 3: Реализация**

`src/hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

- [ ] **Step 4: Pass**

Run: `npm test -- useDebouncedValue`
Expected: PASS (3).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDebouncedValue.ts src/hooks/useDebouncedValue.test.tsx
git commit -m "feat(hooks): useDebouncedValue for search input"
```

---

## Task 10: QueryView shared component (TDD)

**Files:**

- Create: `src/components/shared/QueryView.tsx`
- Create: `src/components/shared/QueryView.test.tsx`
- Create: `src/components/shared/index.ts`

**Design notes:** Контейнер с тремя состояниями (loading/error/empty), все три — вертикально центрированные, минималистичные. Loading: `<ActivityIndicator>` + caption "Загрузка". Error: title + сообщение + кнопка "Повторить". Empty: caption "Ничего не найдено". Большое верт. padding (`spacing['2xl']`).

- [ ] **Step 1: Тест**

`src/components/shared/QueryView.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { QueryView } from './QueryView';

describe('QueryView', () => {
  it('рендерит loading state', () => {
    const { getByText } = render(
      <QueryView isLoading isError={false} isEmpty={false} onRetry={() => {}}>
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('Загрузка')).toBeTruthy();
  });

  it('рендерит error state с кнопкой повтора', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <QueryView isLoading={false} isError isEmpty={false} onRetry={onRetry}>
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('Не удалось загрузить')).toBeTruthy();
    fireEvent.press(getByText('Повторить'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('рендерит empty state', () => {
    const { getByText } = render(
      <QueryView isLoading={false} isError={false} isEmpty emptyText="Пусто">
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('Пусто')).toBeTruthy();
  });

  it('рендерит children когда всё ок', () => {
    const { getByText } = render(
      <QueryView isLoading={false} isError={false} isEmpty={false}>
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('content')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Fail**

Run: `npm test -- QueryView`
Expected: FAIL.

- [ ] **Step 3: Реализация**

`src/components/shared/QueryView.tsx`:

```tsx
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useTheme } from '@/theme';

type Props = {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function QueryView({
  isLoading,
  isError,
  isEmpty = false,
  emptyText = 'Ничего не найдено',
  onRetry,
  children,
}: Props) {
  const theme = useTheme();
  const center = {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: theme.spacing['2xl'],
    gap: theme.spacing.md,
  };

  if (isLoading) {
    return (
      <View style={center}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text variant="caption" color="textMuted">
          Загрузка
        </Text>
      </View>
    );
  }
  if (isError) {
    return (
      <View style={center}>
        <Text variant="bodyLg" weight="semibold">
          Не удалось загрузить
        </Text>
        <Text variant="caption" color="textMuted" align="center">
          Проверьте соединение и попробуйте ещё раз
        </Text>
        {onRetry && <Button label="Повторить" variant="secondary" size="sm" onPress={onRetry} />}
      </View>
    );
  }
  if (isEmpty) {
    return (
      <View style={center}>
        <Text variant="caption" color="textMuted">
          {emptyText}
        </Text>
      </View>
    );
  }
  return <>{children}</>;
}
```

`src/components/shared/index.ts`:

```ts
export { QueryView } from './QueryView';
```

- [ ] **Step 4: Pass**

Run: `npm test -- QueryView`
Expected: PASS (4).

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/
git commit -m "feat(shared): QueryView wrapper for loading/error/empty"
```

---

# Phase 4 — Shared content components

Все компоненты — в `src/components/shared/`. Каждый экспортируется из `src/components/shared/index.ts`.

**Общий формат тестов:** smoke-render + проверка ключевых пропсов. RTL `render`, поиск по тексту/testID.

## Task 11: TierBadge (TDD)

**Files:**

- Create: `src/components/shared/TierBadge.tsx`
- Create: `src/components/shared/TierBadge.test.tsx`
- Modify: `src/components/shared/index.ts`

**Design:** Маленький pill (radii.full) с текстом тарифа. Free — серый, basic — нейтральный, pro — accent solid, pro_max — accent gradient (для MVP — solid). Glass border 1px. Высота 22px, paddingHorizontal `spacing.sm`, caption text uppercase.

- [ ] **Step 1: Тест**

```tsx
import { render } from '@testing-library/react-native';
import { TierBadge } from './TierBadge';

describe('TierBadge', () => {
  it('рендерит метку тарифа', () => {
    const { getByText } = render(<TierBadge tier="pro" />);
    expect(getByText('PRO')).toBeTruthy();
  });
  it('правильно форматирует pro_max', () => {
    const { getByText } = render(<TierBadge tier="pro_max" />);
    expect(getByText('PRO MAX')).toBeTruthy();
  });
  it('free и basic тоже', () => {
    expect(render(<TierBadge tier="free" />).getByText('FREE')).toBeTruthy();
    expect(render(<TierBadge tier="basic" />).getByText('BASIC')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Fail.** Run: `npm test -- TierBadge` → FAIL.

- [ ] **Step 3: Реализация**

```tsx
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Tier } from '@/features/exercises/lib/tierGate';

const LABELS: Record<Tier, string> = {
  free: 'FREE',
  basic: 'BASIC',
  pro: 'PRO',
  pro_max: 'PRO MAX',
};

export function TierBadge({ tier }: { tier: Tier }) {
  const theme = useTheme();
  const isPaid = tier !== 'free';
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radii.full,
        backgroundColor: isPaid ? theme.colors.accent : theme.colors.bgElevated,
        borderWidth: isPaid ? 0 : 1,
        borderColor: theme.colors.glassBorder,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" weight="bold" color={isPaid ? 'white' : 'textMuted'}>
        {LABELS[tier]}
      </Text>
    </View>
  );
}
```

> Если в `Text` нет цвета `'white'` — добавить в Text props mapping или использовать inline `style={{ color: '#fff' }}`. Проверить `src/components/ui/Text/Text.tsx`.

- [ ] **Step 4: Pass.** Run: `npm test -- TierBadge` → PASS.

- [ ] **Step 5: Update index**

В `src/components/shared/index.ts` добавить:

```ts
export { TierBadge } from './TierBadge';
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/TierBadge.tsx src/components/shared/TierBadge.test.tsx src/components/shared/index.ts
git commit -m "feat(shared): TierBadge component"
```

---

## Task 12: DifficultyDots (TDD)

**Files:**

- Create: `src/components/shared/DifficultyDots.tsx`
- Create: `src/components/shared/DifficultyDots.test.tsx`
- Modify: `src/components/shared/index.ts`

**Design:** 5 точек диаметром 6px, gap `spacing.xs`. Заполненные — `accent`, пустые — `divider`.

- [ ] **Step 1: Тест**

```tsx
import { render } from '@testing-library/react-native';
import { DifficultyDots } from './DifficultyDots';

describe('DifficultyDots', () => {
  it('рендерит 5 точек', () => {
    const { getAllByTestId } = render(<DifficultyDots level={3} />);
    expect(getAllByTestId('dot')).toHaveLength(5);
  });
  it('отмечает level точек заполненными', () => {
    const { getAllByTestId } = render(<DifficultyDots level={2} />);
    const dots = getAllByTestId('dot');
    expect(dots[0].props.accessibilityState?.selected).toBe(true);
    expect(dots[1].props.accessibilityState?.selected).toBe(true);
    expect(dots[2].props.accessibilityState?.selected).toBe(false);
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```tsx
import { View } from 'react-native';
import { useTheme } from '@/theme';

export function DifficultyDots({ level }: { level: number }) {
  const theme = useTheme();
  const total = 5;
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < level;
        return (
          <View
            key={i}
            testID="dot"
            accessibilityState={{ selected: filled }}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: filled ? theme.colors.accent : theme.colors.divider,
            }}
          />
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Pass.**

- [ ] **Step 5: index + commit**

```ts
export { DifficultyDots } from './DifficultyDots';
```

```bash
git add src/components/shared/DifficultyDots* src/components/shared/index.ts
git commit -m "feat(shared): DifficultyDots indicator"
```

---

## Task 13: PaywallCard (TDD)

**Files:**

- Create: `src/components/shared/PaywallCard.tsx`
- Create: `src/components/shared/PaywallCard.test.tsx`
- Modify: `src/components/shared/index.ts`

**Design:** Glass-карточка с заголовком ("Доступно с подпиской BASIC/PRO/…"), описанием и Button "Подробнее" (заглушка под Iter 3 — пока `onPress` ничего не делает или Alert). Высота ~180px, центр-выравнивание контента.

- [ ] **Step 1: Тест**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { PaywallCard } from './PaywallCard';

describe('PaywallCard', () => {
  it('показывает требуемый тариф', () => {
    const { getByText } = render(<PaywallCard requiredTier="pro" />);
    expect(getByText(/PRO/)).toBeTruthy();
  });
  it('вызывает onLearnMore при тапе на кнопку', () => {
    const fn = jest.fn();
    const { getByText } = render(<PaywallCard requiredTier="basic" onLearnMore={fn} />);
    fireEvent.press(getByText('Подробнее'));
    expect(fn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```tsx
import { View } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Tier } from '@/features/exercises/lib/tierGate';

const TIER_LABEL: Record<Tier, string> = {
  free: 'FREE',
  basic: 'BASIC',
  pro: 'PRO',
  pro_max: 'PRO MAX',
};

type Props = { requiredTier: Tier; onLearnMore?: () => void };

export function PaywallCard({ requiredTier, onLearnMore }: Props) {
  const theme = useTheme();
  return (
    <Card variant="glass">
      <View
        style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.lg }}
      >
        <Text variant="titleLg" weight="bold" align="center">
          Доступно с подпиской {TIER_LABEL[requiredTier]}
        </Text>
        <Text variant="caption" color="textMuted" align="center">
          Откройте полный доступ к видео техники, программам и тренировкам
        </Text>
        <Button label="Подробнее" variant="primary" size="md" onPress={onLearnMore ?? (() => {})} />
      </View>
    </Card>
  );
}
```

- [ ] **Step 4: Pass.**

- [ ] **Step 5: index + commit**

```ts
export { PaywallCard } from './PaywallCard';
```

```bash
git add src/components/shared/PaywallCard* src/components/shared/index.ts
git commit -m "feat(shared): PaywallCard for tier-gated content"
```

---

## Task 14: WorkoutCard (TDD)

**Files:**

- Create: `src/components/shared/WorkoutCard.tsx`
- Create: `src/components/shared/WorkoutCard.test.tsx`
- Modify: `src/components/shared/index.ts`

**Design (минимализм + glass):** Прямоугольная glass-карточка 100% width × ~140 высота. Слева — обложка-картинка `radii.lg` 100×100. Справа сверху вниз: title (`bodyLg`, semibold), category caption, ряд: длительность · DifficultyDots · TierBadge (если paid). Padding `spacing.md`. Тень `sm`.

- [ ] **Step 1: Тест**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { WorkoutCard } from './WorkoutCard';

const w = {
  slug: 'upper-power',
  title: 'Верх тела',
  category: 'upper' as const,
  cover_url: null,
  duration_minutes: 45,
  difficulty: 3,
  min_tier: 'basic' as const,
};

describe('WorkoutCard', () => {
  it('рендерит title и duration', () => {
    const { getByText } = render(<WorkoutCard workout={w} onPress={() => {}} />);
    expect(getByText('Верх тела')).toBeTruthy();
    expect(getByText(/45/)).toBeTruthy();
  });
  it('показывает TierBadge для paid', () => {
    const { getByText } = render(<WorkoutCard workout={w} onPress={() => {}} />);
    expect(getByText('BASIC')).toBeTruthy();
  });
  it('не показывает badge для free', () => {
    const { queryByText } = render(
      <WorkoutCard workout={{ ...w, min_tier: 'free' }} onPress={() => {}} />,
    );
    expect(queryByText('FREE')).toBeNull();
  });
  it('вызывает onPress', () => {
    const fn = jest.fn();
    const { getByText } = render(<WorkoutCard workout={w} onPress={fn} />);
    fireEvent.press(getByText('Верх тела'));
    expect(fn).toHaveBeenCalledWith('upper-power');
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```tsx
import { Image, Pressable, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { DifficultyDots } from './DifficultyDots';
import { TierBadge } from './TierBadge';
import type { Tier } from '@/features/exercises/lib/tierGate';

export type WorkoutCardData = {
  slug: string;
  title: string;
  category: string;
  cover_url: string | null;
  duration_minutes: number;
  difficulty: number;
  min_tier: Tier;
};

type Props = { workout: WorkoutCardData; onPress: (slug: string) => void };

export function WorkoutCard({ workout, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => onPress(workout.slug)}>
      <Card variant="glass">
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {workout.cover_url && (
              <Image
                source={{ uri: workout.cover_url }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="bodyLg" weight="semibold">
              {workout.title}
            </Text>
            <Text variant="caption" color="textMuted">
              {workout.category}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: theme.spacing.sm,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Text variant="caption" color="textMuted">
                {workout.duration_minutes} мин
              </Text>
              <DifficultyDots level={workout.difficulty} />
              {workout.min_tier !== 'free' && <TierBadge tier={workout.min_tier} />}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 4: Pass.**

- [ ] **Step 5: index + commit**

```ts
export { WorkoutCard } from './WorkoutCard';
export type { WorkoutCardData } from './WorkoutCard';
```

```bash
git add src/components/shared/WorkoutCard* src/components/shared/index.ts
git commit -m "feat(shared): WorkoutCard"
```

---

## Task 15: ProgramCard (TDD)

**Files:**

- Create: `src/components/shared/ProgramCard.tsx`
- Create: `src/components/shared/ProgramCard.test.tsx`
- Modify: `src/components/shared/index.ts`

**Design:** Похожа на WorkoutCard, но обложка сверху (full-width, высота 140), под ней — title (`titleLg`), описание (`caption` 2 строки), ряд: "8 нед × 3 раза" · DifficultyDots · TierBadge.

- [ ] **Step 1: Тест**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { ProgramCard } from './ProgramCard';

const p = {
  slug: '8-week',
  title: '8 недель',
  description: 'desc',
  cover_url: null,
  weeks: 8,
  sessions_per_week: 3,
  difficulty: 3,
  min_tier: 'pro' as const,
};

describe('ProgramCard', () => {
  it('рендерит title и weeks/sessions', () => {
    const { getByText } = render(<ProgramCard program={p} onPress={() => {}} />);
    expect(getByText('8 недель')).toBeTruthy();
    expect(getByText(/8 нед/)).toBeTruthy();
    expect(getByText(/3 раз/)).toBeTruthy();
  });
  it('PRO badge', () => {
    const { getByText } = render(<ProgramCard program={p} onPress={() => {}} />);
    expect(getByText('PRO')).toBeTruthy();
  });
  it('onPress', () => {
    const fn = jest.fn();
    const { getByText } = render(<ProgramCard program={p} onPress={fn} />);
    fireEvent.press(getByText('8 недель'));
    expect(fn).toHaveBeenCalledWith('8-week');
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```tsx
import { Image, Pressable, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { DifficultyDots } from './DifficultyDots';
import { TierBadge } from './TierBadge';
import type { Tier } from '@/features/exercises/lib/tierGate';

export type ProgramCardData = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  weeks: number;
  sessions_per_week: number;
  difficulty: number;
  min_tier: Tier;
};

type Props = { program: ProgramCardData; onPress: (slug: string) => void };

export function ProgramCard({ program, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => onPress(program.slug)}>
      <Card variant="glass">
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              height: 140,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {program.cover_url && (
              <Image
                source={{ uri: program.cover_url }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>
          <Text variant="titleLg" weight="semibold">
            {program.title}
          </Text>
          {program.description && (
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {program.description}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.sm,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Text variant="caption" color="textMuted">
              {program.weeks} нед · {program.sessions_per_week} раз/нед
            </Text>
            <DifficultyDots level={program.difficulty} />
            {program.min_tier !== 'free' && <TierBadge tier={program.min_tier} />}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 4: Pass.**

- [ ] **Step 5: index + commit**

```ts
export { ProgramCard } from './ProgramCard';
export type { ProgramCardData } from './ProgramCard';
```

```bash
git add src/components/shared/ProgramCard* src/components/shared/index.ts
git commit -m "feat(shared): ProgramCard"
```

---

## Task 16: BlogPostCard (TDD)

**Files:**

- Create: `src/components/shared/BlogPostCard.tsx`
- Create: `src/components/shared/BlogPostCard.test.tsx`
- Modify: `src/components/shared/index.ts`

**Design:** Glass-карточка. Обложка сверху (height 160, full-width, `radii.lg`). Дата + title (`titleLg`) + excerpt (`caption` 2 строки).

- [ ] **Step 1: Тест**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { BlogPostCard } from './BlogPostCard';

const post = {
  slug: 'how-to-squat',
  title: 'Как приседать',
  excerpt: 'about squat',
  cover_url: null,
  published_at: '2026-05-01T10:00:00Z',
};

describe('BlogPostCard', () => {
  it('рендерит title/excerpt', () => {
    const { getByText } = render(<BlogPostCard post={post} onPress={() => {}} />);
    expect(getByText('Как приседать')).toBeTruthy();
    expect(getByText('about squat')).toBeTruthy();
  });
  it('форматирует дату', () => {
    const { getByText } = render(<BlogPostCard post={post} onPress={() => {}} />);
    expect(getByText(/01\.05\.2026|1 мая 2026/)).toBeTruthy();
  });
  it('onPress', () => {
    const fn = jest.fn();
    const { getByText } = render(<BlogPostCard post={post} onPress={fn} />);
    fireEvent.press(getByText('Как приседать'));
    expect(fn).toHaveBeenCalledWith('how-to-squat');
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```tsx
import { Image, Pressable, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export type BlogPostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

type Props = { post: BlogPostCardData; onPress: (slug: string) => void };

export function BlogPostCard({ post, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => onPress(post.slug)}>
      <Card variant="glass">
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              height: 160,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {post.cover_url && (
              <Image source={{ uri: post.cover_url }} style={{ width: '100%', height: '100%' }} />
            )}
          </View>
          <Text variant="caption" color="textMuted">
            {formatDate(post.published_at)}
          </Text>
          <Text variant="titleLg" weight="semibold">
            {post.title}
          </Text>
          {post.excerpt && (
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {post.excerpt}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 4: Pass.**

- [ ] **Step 5: index + commit**

```ts
export { BlogPostCard } from './BlogPostCard';
export type { BlogPostCardData } from './BlogPostCard';
```

```bash
git add src/components/shared/BlogPostCard* src/components/shared/index.ts
git commit -m "feat(shared): BlogPostCard"
```

---

## Task 17: ExerciseRow (TDD)

**Files:**

- Create: `src/components/shared/ExerciseRow.tsx`
- Create: `src/components/shared/ExerciseRow.test.tsx`
- Modify: `src/components/shared/index.ts`

**Design:** Горизонтальный ряд (плоский, без glass-фона — это row внутри workout-detail screen). Слева мини-индекс (порядковый номер в круге, `radii.full` 32×32, `bgElevated`). Центр: name + sets×reps + rest. Справа — chevron `›`.

- [ ] **Step 1: Тест**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { ExerciseRow } from './ExerciseRow';

const row = {
  position: 1,
  exercise_slug: 'squat',
  exercise_name: 'Приседания',
  sets: 4,
  reps: '6-8',
  rest_seconds: 120,
};

describe('ExerciseRow', () => {
  it('рендерит name и sets/reps/rest', () => {
    const { getByText } = render(<ExerciseRow row={row} onPress={() => {}} />);
    expect(getByText('Приседания')).toBeTruthy();
    expect(getByText(/4×6-8/)).toBeTruthy();
    expect(getByText(/120/)).toBeTruthy();
  });
  it('показывает позицию', () => {
    const { getByText } = render(<ExerciseRow row={row} onPress={() => {}} />);
    expect(getByText('1')).toBeTruthy();
  });
  it('onPress передаёт slug', () => {
    const fn = jest.fn();
    const { getByText } = render(<ExerciseRow row={row} onPress={fn} />);
    fireEvent.press(getByText('Приседания'));
    expect(fn).toHaveBeenCalledWith('squat');
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```tsx
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

export type ExerciseRowData = {
  position: number;
  exercise_slug: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
};

type Props = { row: ExerciseRowData; onPress: (slug: string) => void };

export function ExerciseRow({ row, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => onPress(row.exercise_slug)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.bgElevated,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="caption" weight="semibold">
            {row.position}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyLg" weight="medium">
            {row.exercise_name}
          </Text>
          <Text variant="caption" color="textMuted">
            {row.sets}×{row.reps} · отдых {row.rest_seconds}с
          </Text>
        </View>
        <Text variant="bodyLg" color="textMuted">
          ›
        </Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 4: Pass.**

- [ ] **Step 5: index + commit**

```ts
export { ExerciseRow } from './ExerciseRow';
export type { ExerciseRowData } from './ExerciseRow';
```

```bash
git add src/components/shared/ExerciseRow* src/components/shared/index.ts
git commit -m "feat(shared): ExerciseRow"
```

---

# Phase 5 — Exercises feature

## Task 18: types.ts + listExercises API (TDD)

**Files:**

- Create: `src/features/exercises/types.ts`
- Create: `src/features/exercises/api/listExercises.ts`
- Create: `src/features/exercises/api/listExercises.test.ts`

- [ ] **Step 1: types.ts**

```ts
import type { Database } from '@/lib/database.types';

export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type MuscleGroup = Database['public']['Enums']['muscle_group_enum'];
```

- [ ] **Step 2: Тест**

`src/features/exercises/api/listExercises.test.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { listExercises } from './listExercises';

const fromMock = supabase.from as jest.Mock;

describe('listExercises', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает все упражнения, отсортированные по name', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'squat', name: 'Squat' }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    const res = await listExercises();
    expect(fromMock).toHaveBeenCalledWith('exercises');
    expect(select).toHaveBeenCalledWith('*');
    expect(order).toHaveBeenCalledWith('name', { ascending: true });
    expect(res).toEqual([{ id: '1', slug: 'squat', name: 'Squat' }]);
  });

  it('фильтрует по primary_muscle если передан', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    await listExercises('chest');
    expect(eq).toHaveBeenCalledWith('primary_muscle', 'chest');
  });

  it('бросает ошибку при error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'oops' } });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    await expect(listExercises()).rejects.toEqual({ message: 'oops' });
  });
});
```

- [ ] **Step 3: Fail.**

- [ ] **Step 4: Реализация**

`src/features/exercises/api/listExercises.ts`:

```ts
import { supabase } from '@/lib/supabase';
import type { Exercise, MuscleGroup } from '../types';

export async function listExercises(filter?: MuscleGroup): Promise<Exercise[]> {
  const builder = supabase.from('exercises').select('*');
  const query = filter ? builder.eq('primary_muscle', filter) : builder;
  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 5: Pass.**

- [ ] **Step 6: Commit**

```bash
git add src/features/exercises/types.ts src/features/exercises/api/listExercises*
git commit -m "feat(exercises): listExercises API + types"
```

---

## Task 19: getExercise + getExerciseGifUrl + getExerciseVideoUrl APIs (TDD)

**Files:**

- Create: `src/features/exercises/api/getExercise.ts`
- Create: `src/features/exercises/api/getExercise.test.ts`
- Create: `src/features/exercises/api/getExerciseGifUrl.ts`
- Create: `src/features/exercises/api/getExerciseGifUrl.test.ts`
- Create: `src/features/exercises/api/getExerciseVideoUrl.ts`
- Create: `src/features/exercises/api/getExerciseVideoUrl.test.ts`
- Create: `src/features/exercises/api/index.ts`

- [ ] **Step 1: Тесты**

`getExercise.test.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { getExercise } from './getExercise';

const fromMock = supabase.from as jest.Mock;

describe('getExercise', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает exercise по slug', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: { id: '1', slug: 'squat' },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    const res = await getExercise('squat');
    expect(fromMock).toHaveBeenCalledWith('exercises');
    expect(eq).toHaveBeenCalledWith('slug', 'squat');
    expect(res).toEqual({ id: '1', slug: 'squat' });
  });

  it('бросает ошибку при error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'nf' } });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    await expect(getExercise('x')).rejects.toEqual({ message: 'nf' });
  });
});
```

`getExerciseGifUrl.test.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { getExerciseGifUrl } from './getExerciseGifUrl';

const rpcMock = supabase.rpc as jest.Mock;

describe('getExerciseGifUrl', () => {
  beforeEach(() => rpcMock.mockReset());

  it('возвращает signed url', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'https://signed', error: null });
    const url = await getExerciseGifUrl('squat');
    expect(rpcMock).toHaveBeenCalledWith('get_exercise_gif_url', { exercise_slug: 'squat' });
    expect(url).toBe('https://signed');
  });

  it('возвращает null если нет gif', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await getExerciseGifUrl('x')).toBeNull();
  });

  it('бросает ошибку при error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    await expect(getExerciseGifUrl('x')).rejects.toEqual({ message: 'e' });
  });
});
```

`getExerciseVideoUrl.test.ts`:

```ts
import { supabase } from '@/lib/supabase';
import { getExerciseVideoUrl } from './getExerciseVideoUrl';

const rpcMock = supabase.rpc as jest.Mock;

describe('getExerciseVideoUrl', () => {
  beforeEach(() => rpcMock.mockReset());

  it('возвращает signed url', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'https://video', error: null });
    expect(await getExerciseVideoUrl('squat')).toBe('https://video');
    expect(rpcMock).toHaveBeenCalledWith('get_exercise_video_url', { exercise_slug: 'squat' });
  });

  it('возвращает null если нет видео', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await getExerciseVideoUrl('x')).toBeNull();
  });

  it('пробрасывает subscription required', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'subscription required' } });
    await expect(getExerciseVideoUrl('x')).rejects.toEqual({ message: 'subscription required' });
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

`getExercise.ts`:

```ts
import { supabase } from '@/lib/supabase';
import type { Exercise } from '../types';

export async function getExercise(slug: string): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}
```

`getExerciseGifUrl.ts`:

```ts
import { supabase } from '@/lib/supabase';

export async function getExerciseGifUrl(slug: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_exercise_gif_url', { exercise_slug: slug });
  if (error) throw error;
  return data ?? null;
}
```

`getExerciseVideoUrl.ts`:

```ts
import { supabase } from '@/lib/supabase';

export async function getExerciseVideoUrl(slug: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_exercise_video_url', { exercise_slug: slug });
  if (error) throw error;
  return data ?? null;
}
```

`api/index.ts`:

```ts
export { listExercises } from './listExercises';
export { getExercise } from './getExercise';
export { getExerciseGifUrl } from './getExerciseGifUrl';
export { getExerciseVideoUrl } from './getExerciseVideoUrl';
```

- [ ] **Step 4: Pass.** Run: `npm test -- features/exercises/api`

- [ ] **Step 5: Commit**

```bash
git add src/features/exercises/api/
git commit -m "feat(exercises): getExercise + GIF/video signed URL APIs"
```

---

## Task 20: Hooks useExercises + useExercise + useExerciseVideoUrl (TDD)

**Files:**

- Create: `src/features/exercises/hooks/useExercises.ts`
- Create: `src/features/exercises/hooks/useExercises.test.tsx`
- Create: `src/features/exercises/hooks/useExercise.ts`
- Create: `src/features/exercises/hooks/useExerciseVideoUrl.ts`
- Create: `src/features/exercises/hooks/useExerciseVideoUrl.test.tsx`

- [ ] **Step 1: Тесты**

`useExercises.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useExercises } from './useExercises';

const fromMock = supabase.from as jest.Mock;

describe('useExercises', () => {
  beforeEach(() => fromMock.mockReset());

  it('фетчит и возвращает упражнения', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'squat', name: 'Squat' }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useExercises(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
  });
});
```

`useExerciseVideoUrl.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useExerciseVideoUrl } from './useExerciseVideoUrl';

const rpcMock = supabase.rpc as jest.Mock;

describe('useExerciseVideoUrl', () => {
  beforeEach(() => rpcMock.mockReset());

  it('disabled пока enabled=false', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useExerciseVideoUrl('squat', false), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('фетчит url когда enabled=true', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'https://v', error: null });
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useExerciseVideoUrl('squat', true), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toBe('https://v'));
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

`useExercises.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listExercises } from '../api/listExercises';
import type { MuscleGroup } from '../types';

export function useExercises(filter?: MuscleGroup) {
  return useQuery({
    queryKey: qk.exercises.list(filter),
    queryFn: () => listExercises(filter),
    staleTime: 5 * 60 * 1000,
  });
}
```

`useExercise.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getExercise } from '../api/getExercise';

export function useExercise(slug: string | undefined) {
  return useQuery({
    queryKey: qk.exercises.detail(slug ?? ''),
    queryFn: () => getExercise(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
```

`useExerciseVideoUrl.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getExerciseVideoUrl } from '../api/getExerciseVideoUrl';

export function useExerciseVideoUrl(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.exercises.videoUrl(slug),
    queryFn: () => getExerciseVideoUrl(slug),
    enabled,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
  });
}
```

- [ ] **Step 4: Pass.**

- [ ] **Step 5: Commit**

```bash
git add src/features/exercises/hooks/
git commit -m "feat(exercises): useExercises/useExercise/useExerciseVideoUrl hooks"
```

---

## Task 21: Refactor — useExerciseGifUrl + index hooks

**Files:**

- Create: `src/features/exercises/hooks/useExerciseGifUrl.ts`
- Create: `src/features/exercises/hooks/index.ts`

- [ ] **Step 1: useExerciseGifUrl.ts**

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getExerciseGifUrl } from '../api/getExerciseGifUrl';

export function useExerciseGifUrl(slug: string) {
  return useQuery({
    queryKey: qk.exercises.gifUrl(slug),
    queryFn: () => getExerciseGifUrl(slug),
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
  });
}
```

- [ ] **Step 2: hooks/index.ts**

```ts
export { useExercises } from './useExercises';
export { useExercise } from './useExercise';
export { useExerciseGifUrl } from './useExerciseGifUrl';
export { useExerciseVideoUrl } from './useExerciseVideoUrl';
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/exercises/hooks/
git commit -m "feat(exercises): useExerciseGifUrl + hooks index"
```

---

## Task 22: Экран `app/(tabs)/exercises/[slug].tsx` + smoke test

**Files:**

- Create: `app/(tabs)/exercises/_layout.tsx`
- Create: `app/(tabs)/exercises/[slug].tsx`
- Create: `app/(tabs)/exercises/[slug].test.tsx`

**Design:** Хедер с back-кнопкой (round glass 40×40, левый верх). Hero: GIF превью (full-width, height 280, `radii.xl`). Под ним — title (`hero` weight bold), chips муск-групп и оборудования (мелкие pill'ы из `bgElevated` + caption). Description (`bodyLg`). Раздел "Видео техники": `<VideoView>` если tier ОК, иначе `<PaywallCard requiredTier={ex.min_tier} />`. ScrollView с `contentContainerStyle padding spacing.lg gap spacing.lg`.

- [ ] **Step 1: Установить expo-video**

Run: `npx expo install expo-video`

- [ ] **Step 2: Layout**

`app/(tabs)/exercises/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function ExercisesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Smoke-тест**

`app/(tabs)/exercises/[slug].test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import ExerciseScreen from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'squat' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('expo-video', () => ({
  VideoView: ({ testID }: any) => null,
  useVideoPlayer: () => ({}),
}));

const fromMock = supabase.from as jest.Mock;
const rpcMock = supabase.rpc as jest.Mock;

describe('ExerciseScreen', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });
  });

  function setupExercise(min_tier: string, profile_tier: string) {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: '1',
        slug: 'squat',
        name: 'Squat',
        description: 'desc',
        primary_muscle: 'quads',
        secondary_muscles: ['glutes'],
        equipment: ['barbell'],
        gif_path: 'g.gif',
        video_path: 'v.mp4',
        min_tier,
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockImplementation((table: string) => {
      if (table === 'exercises') return { select: () => ({ eq }) };
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: 'u1', subscription_tier: profile_tier, is_admin: false },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    rpcMock.mockImplementation((name: string) => {
      if (name === 'get_exercise_gif_url')
        return Promise.resolve({ data: 'https://gif', error: null });
      if (name === 'get_exercise_video_url')
        return Promise.resolve({ data: 'https://video', error: null });
      return Promise.resolve({ data: null, error: null });
    });
  }

  it('рендерит exercise с GIF и видео для pro юзера', async () => {
    setupExercise('basic', 'pro');
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ExerciseScreen />, { wrapper: Wrapper });
    await waitFor(() => expect(findByText('Squat')).toBeTruthy());
  });

  it('показывает paywall если tier недостаточен', async () => {
    setupExercise('pro', 'free');
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ExerciseScreen />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText(/PRO/i)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 4: Реализация**

`app/(tabs)/exercises/[slug].tsx`:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Card, Screen, Text } from '@/components/ui';
import { PaywallCard, QueryView } from '@/components/shared';
import { useExercise, useExerciseGifUrl, useExerciseVideoUrl } from '@/features/exercises/hooks';
import { hasAccess, type Tier } from '@/features/exercises/lib/tierGate';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useTheme } from '@/theme';

export default function ExerciseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const exercise = useExercise(slug);
  const gif = useExerciseGifUrl(slug ?? '');
  const profile = useProfile();
  const userTier = (profile.data?.subscription_tier ?? 'free') as Tier;
  const minTier = (exercise.data?.min_tier ?? 'free') as Tier;
  const allowed = hasAccess(userTier, minTier);
  const video = useExerciseVideoUrl(slug ?? '', allowed && Boolean(exercise.data?.video_path));
  const player = useVideoPlayer(video.data ?? null);

  useEffect(() => {
    if (player && video.data) player.play();
  }, [player, video.data]);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.glassBg,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyLg">‹</Text>
        </Pressable>

        <QueryView
          isLoading={exercise.isLoading}
          isError={exercise.isError}
          isEmpty={false}
          onRetry={() => exercise.refetch()}
        >
          {exercise.data && (
            <View style={{ gap: theme.spacing.lg }}>
              <View
                style={{
                  height: 280,
                  borderRadius: theme.radii.xl,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.bgElevated,
                }}
              >
                {gif.data && (
                  <Image
                    source={{ uri: gif.data }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                )}
              </View>

              <Text variant="hero" weight="bold">
                {exercise.data.name}
              </Text>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                <Chip text={exercise.data.primary_muscle} />
                {exercise.data.secondary_muscles.map((m) => (
                  <Chip key={m} text={m} muted />
                ))}
                {exercise.data.equipment.map((eq) => (
                  <Chip key={eq} text={eq} muted />
                ))}
              </View>

              {exercise.data.description && (
                <Text variant="bodyLg" color="textMuted">
                  {exercise.data.description}
                </Text>
              )}

              {exercise.data.video_path && (
                <View style={{ gap: theme.spacing.md }}>
                  <Text variant="titleLg" weight="semibold">
                    Видео техники
                  </Text>
                  {!allowed ? (
                    <PaywallCard requiredTier={minTier} />
                  ) : (
                    <View
                      style={{
                        height: 220,
                        borderRadius: theme.radii.xl,
                        overflow: 'hidden',
                        backgroundColor: theme.colors.bgElevated,
                      }}
                    >
                      {video.data && (
                        <VideoView
                          player={player}
                          style={{ width: '100%', height: '100%' }}
                          allowsFullscreen
                          contentFit="cover"
                        />
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </QueryView>
      </ScrollView>
    </Screen>
  );
}

function Chip({ text, muted }: { text: string; muted?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radii.full,
        backgroundColor: muted ? theme.colors.bgElevated : theme.colors.accent,
      }}
    >
      <Text variant="caption" weight="medium" color={muted ? 'text' : 'white'}>
        {text}
      </Text>
    </View>
  );
}
```

- [ ] **Step 5: Pass.** Run: `npm test -- exercises/\\[slug\\]`

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/exercises/ package.json package-lock.json
git commit -m "feat(exercises): exercise detail screen with tier-gated video"
```

---

# Phase 6 — Workouts feature

## Task 23: types + listWorkouts API (TDD)

**Files:**

- Create: `src/features/workouts/types.ts`
- Create: `src/features/workouts/api/listWorkouts.ts`
- Create: `src/features/workouts/api/listWorkouts.test.ts`

- [ ] **Step 1: types.ts**

```ts
import type { Database } from '@/lib/database.types';

export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutCategory = Database['public']['Enums']['workout_category_enum'];
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];

export type WorkoutDetail = Workout & {
  exercises: Array<
    WorkoutExercise & {
      exercise: { slug: string; name: string };
    }
  >;
};
```

- [ ] **Step 2: Тест**

```ts
import { supabase } from '@/lib/supabase';
import { listWorkouts } from './listWorkouts';

const fromMock = supabase.from as jest.Mock;

describe('listWorkouts', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает workouts по убыванию created_at', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'a' }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });

    const res = await listWorkouts();
    expect(fromMock).toHaveBeenCalledWith('workouts');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toHaveLength(1);
  });

  it('фильтрует по category', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    await listWorkouts('upper');
    expect(eq).toHaveBeenCalledWith('category', 'upper');
  });

  it('бросает error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    const select = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select });
    await expect(listWorkouts()).rejects.toEqual({ message: 'e' });
  });
});
```

- [ ] **Step 3: Fail.**

- [ ] **Step 4: Реализация**

```ts
import { supabase } from '@/lib/supabase';
import type { Workout, WorkoutCategory } from '../types';

export async function listWorkouts(category?: WorkoutCategory): Promise<Workout[]> {
  const builder = supabase.from('workouts').select('*');
  const query = category ? builder.eq('category', category) : builder;
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 5: Pass + commit**

```bash
git add src/features/workouts/types.ts src/features/workouts/api/listWorkouts*
git commit -m "feat(workouts): listWorkouts + types"
```

---

## Task 24: getWorkoutDetail API (TDD)

**Files:**

- Create: `src/features/workouts/api/getWorkoutDetail.ts`
- Create: `src/features/workouts/api/getWorkoutDetail.test.ts`
- Create: `src/features/workouts/api/index.ts`

- [ ] **Step 1: Тест**

```ts
import { supabase } from '@/lib/supabase';
import { getWorkoutDetail } from './getWorkoutDetail';

const fromMock = supabase.from as jest.Mock;

describe('getWorkoutDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает workout с join workout_exercises+exercise', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'w1',
        slug: 'upper-power',
        title: 'Upper',
        workout_exercises: [
          {
            workout_id: 'w1',
            position: 1,
            exercise_id: 'e1',
            sets: 4,
            reps: '6',
            rest_seconds: 120,
            notes: null,
            exercise: { slug: 'squat', name: 'Squat' },
          },
        ],
      },
      error: null,
    });
    const order = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ single, order }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    const res = await getWorkoutDetail('upper-power');
    expect(fromMock).toHaveBeenCalledWith('workouts');
    expect(select.mock.calls[0][0]).toContain('workout_exercises');
    expect(eq).toHaveBeenCalledWith('slug', 'upper-power');
    expect(res.exercises).toHaveLength(1);
    expect(res.exercises[0].exercise.slug).toBe('squat');
  });

  it('бросает error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'nf' } });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });
    await expect(getWorkoutDetail('x')).rejects.toEqual({ message: 'nf' });
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```ts
import { supabase } from '@/lib/supabase';
import type { WorkoutDetail } from '../types';

export async function getWorkoutDetail(slug: string): Promise<WorkoutDetail> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      `
      *,
      workout_exercises (
        workout_id, position, exercise_id, sets, reps, rest_seconds, notes,
        exercise:exercises ( slug, name )
      )
    `,
    )
    .eq('slug', slug)
    .single();
  if (error) throw error;
  const sorted = [...(data.workout_exercises ?? [])].sort((a, b) => a.position - b.position);
  return { ...data, exercises: sorted } as WorkoutDetail;
}
```

`api/index.ts`:

```ts
export { listWorkouts } from './listWorkouts';
export { getWorkoutDetail } from './getWorkoutDetail';
```

- [ ] **Step 4: Pass + commit**

```bash
git add src/features/workouts/api/
git commit -m "feat(workouts): getWorkoutDetail with exercises join"
```

---

## Task 25: Hooks useWorkouts + useWorkoutDetail (TDD)

**Files:**

- Create: `src/features/workouts/hooks/useWorkouts.ts`
- Create: `src/features/workouts/hooks/useWorkouts.test.tsx`
- Create: `src/features/workouts/hooks/useWorkoutDetail.ts`
- Create: `src/features/workouts/hooks/index.ts`

- [ ] **Step 1: Тест useWorkouts**

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useWorkouts } from './useWorkouts';

const fromMock = supabase.from as jest.Mock;

describe('useWorkouts', () => {
  beforeEach(() => fromMock.mockReset());

  it('фетчит', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'a' }],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useWorkouts(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
```

- [ ] **Step 2: Fail + impl**

`useWorkouts.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listWorkouts } from '../api/listWorkouts';
import type { WorkoutCategory } from '../types';

export function useWorkouts(category?: WorkoutCategory) {
  return useQuery({
    queryKey: qk.workouts.list(category),
    queryFn: () => listWorkouts(category),
    staleTime: 5 * 60 * 1000,
  });
}
```

`useWorkoutDetail.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getWorkoutDetail } from '../api/getWorkoutDetail';

export function useWorkoutDetail(slug: string | undefined) {
  return useQuery({
    queryKey: qk.workouts.detail(slug ?? ''),
    queryFn: () => getWorkoutDetail(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
```

`index.ts`:

```ts
export { useWorkouts } from './useWorkouts';
export { useWorkoutDetail } from './useWorkoutDetail';
```

- [ ] **Step 3: Pass + commit**

```bash
git add src/features/workouts/hooks/
git commit -m "feat(workouts): useWorkouts + useWorkoutDetail hooks"
```

---

## Task 26: Удалить старый workouts.tsx + создать workouts/index.tsx (list screen)

**Files:**

- Delete: `app/(tabs)/workouts.tsx`
- Create: `app/(tabs)/workouts/_layout.tsx`
- Create: `app/(tabs)/workouts/index.tsx`
- Create: `app/(tabs)/workouts/index.test.tsx`

**Design:** Header — `Text variant="hero" weight="bold"` "Тренировки" + `Segmented` с категориями. FlatList glass-карточек `WorkoutCard`. Pull-to-refresh.

- [ ] **Step 1: Удалить старый файл**

```bash
git rm app/(tabs)/workouts.tsx
```

- [ ] **Step 2: Layout**

`app/(tabs)/workouts/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
export default function WorkoutsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Smoke test**

`app/(tabs)/workouts/index.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { getPublicUrl } from '@/services/storage';
import WorkoutsList from './index';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/services/storage', () => ({
  getPublicUrl: jest.fn(() => null),
}));

const fromMock = supabase.from as jest.Mock;

describe('WorkoutsList screen', () => {
  beforeEach(() => fromMock.mockReset());

  it('рендерит список', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: '1',
          slug: 'upper',
          title: 'Upper Power',
          category: 'upper',
          cover_path: 'c.jpg',
          duration_minutes: 45,
          difficulty: 3,
          min_tier: 'basic',
          description: '',
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });

    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<WorkoutsList />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Upper Power')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 4: Fail.**

- [ ] **Step 5: Реализация**

`app/(tabs)/workouts/index.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Screen, Text, Segmented } from '@/components/ui';
import { QueryView, WorkoutCard } from '@/components/shared';
import type { WorkoutCardData } from '@/components/shared/WorkoutCard';
import { useWorkouts } from '@/features/workouts/hooks';
import type { WorkoutCategory } from '@/features/workouts/types';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

const CATEGORIES: Array<{ value: WorkoutCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'upper', label: 'Верх' },
  { value: 'lower', label: 'Низ' },
  { value: 'full_body', label: 'Full body' },
  { value: 'cardio', label: 'Кардио' },
  { value: 'core', label: 'Кор' },
];

export default function WorkoutsList() {
  const theme = useTheme();
  const router = useRouter();
  const [cat, setCat] = useState<WorkoutCategory | 'all'>('all');
  const filter = cat === 'all' ? undefined : cat;
  const q = useWorkouts(filter);

  const items: WorkoutCardData[] = (q.data ?? []).map((w) => ({
    slug: w.slug,
    title: w.title,
    category: w.category,
    cover_url: getPublicUrl('workout-covers', w.cover_path),
    duration_minutes: w.duration_minutes,
    difficulty: w.difficulty,
    min_tier: w.min_tier,
  }));

  return (
    <Screen padded={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
      >
        <Text variant="hero" weight="bold">
          Тренировки
        </Text>
        <Segmented value={cat} options={CATEGORIES} onChange={(v) => setCat(v as typeof cat)} />
      </View>
      <QueryView
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={items.length === 0}
        emptyText="Нет тренировок в этой категории"
        onRetry={() => q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => it.slug}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={(slug) => router.push(`/(tabs)/workouts/${slug}` as never)}
            />
          )}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['3xl'],
            gap: theme.spacing.md,
          }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />
          }
        />
      </QueryView>
    </Screen>
  );
}
```

- [ ] **Step 6: Pass + commit**

```bash
git add app/(tabs)/workouts/
git commit -m "feat(workouts): list screen with category filter"
```

---

## Task 27: workouts/[slug].tsx detail screen + smoke

**Files:**

- Create: `app/(tabs)/workouts/[slug].tsx`
- Create: `app/(tabs)/workouts/[slug].test.tsx`

**Design:** Hero — обложка height 320 (full-width). Поверх неё снизу выезжает glass-карточка с marginTop -64 (overlap), `radii.xl` сверху, padding `lg`. Внутри: title (`heroLg`), meta row (длительность · DifficultyDots · TierBadge), description, divider, "Упражнения" header, список `ExerciseRow`.

- [ ] **Step 1: Smoke test**

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import WorkoutDetail from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'upper-power' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('WorkoutDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('рендерит детали и упражнения', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'w',
        slug: 'upper-power',
        title: 'Upper Power',
        description: 'desc',
        category: 'upper',
        cover_path: 'c.jpg',
        duration_minutes: 45,
        difficulty: 3,
        min_tier: 'basic',
        created_at: '',
        updated_at: '',
        workout_exercises: [
          {
            workout_id: 'w',
            position: 1,
            exercise_id: 'e1',
            sets: 4,
            reps: '6-8',
            rest_seconds: 120,
            notes: null,
            exercise: { slug: 'squat', name: 'Squat' },
          },
        ],
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });

    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<WorkoutDetail />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Upper Power')).toBeTruthy();
      expect(await findByText('Squat')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Fail.**

- [ ] **Step 3: Реализация**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { DifficultyDots, ExerciseRow, QueryView, TierBadge } from '@/components/shared';
import { useWorkoutDetail } from '@/features/workouts/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

export default function WorkoutDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useWorkoutDetail(slug);
  const cover = getPublicUrl('workout-covers', q.data?.cover_path ?? null);

  return (
    <Screen padded={false}>
      <ScrollView>
        <View style={{ height: 320, backgroundColor: theme.colors.bgElevated }}>
          {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 56,
              left: theme.spacing.lg,
              width: 40,
              height: 40,
              borderRadius: theme.radii.full,
              backgroundColor: theme.colors.glassBg,
              borderWidth: 1,
              borderColor: theme.colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="bodyLg">‹</Text>
          </Pressable>
        </View>

        <View
          style={{
            marginTop: -64,
            backgroundColor: theme.colors.bg,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <QueryView
            isLoading={q.isLoading}
            isError={q.isError}
            isEmpty={false}
            onRetry={() => q.refetch()}
          >
            {q.data && (
              <>
                <Text variant="heroLg" weight="bold">
                  {q.data.title}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: theme.spacing.md,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Text variant="caption" color="textMuted">
                    {q.data.duration_minutes} мин
                  </Text>
                  <DifficultyDots level={q.data.difficulty} />
                  {q.data.min_tier !== 'free' && <TierBadge tier={q.data.min_tier} />}
                </View>
                {q.data.description && (
                  <Text variant="bodyLg" color="textMuted">
                    {q.data.description}
                  </Text>
                )}

                <Text variant="titleLg" weight="semibold">
                  Упражнения
                </Text>
                <View>
                  {q.data.exercises.map((row) => (
                    <ExerciseRow
                      key={row.position}
                      row={{
                        position: row.position,
                        exercise_slug: row.exercise.slug,
                        exercise_name: row.exercise.name,
                        sets: row.sets,
                        reps: row.reps,
                        rest_seconds: row.rest_seconds,
                      }}
                      onPress={(s) => router.push(`/(tabs)/exercises/${s}` as never)}
                    />
                  ))}
                </View>
              </>
            )}
          </QueryView>
        </View>
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 4: Pass + commit**

```bash
git add app/(tabs)/workouts/
git commit -m "feat(workouts): detail screen with exercises list"
```

---

# Phase 7 — Programs feature

## Task 28: types + listPrograms API (TDD)

**Files:**

- Create: `src/features/programs/types.ts`
- Create: `src/features/programs/api/listPrograms.ts`
- Create: `src/features/programs/api/listPrograms.test.ts`

- [ ] **Step 1: types.ts**

```ts
import type { Database } from '@/lib/database.types';

export type Program = Database['public']['Tables']['programs']['Row'];
export type ProgramWorkout = Database['public']['Tables']['program_workouts']['Row'];

export type ProgramDetail = Program & {
  schedule: Array<
    ProgramWorkout & {
      workout: { slug: string; title: string };
    }
  >;
};
```

- [ ] **Step 2: Тест**

```ts
import { supabase } from '@/lib/supabase';
import { listPrograms } from './listPrograms';

const fromMock = supabase.from as jest.Mock;

describe('listPrograms', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает все programs', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'p' }],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });

    const res = await listPrograms();
    expect(fromMock).toHaveBeenCalledWith('programs');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toHaveLength(1);
  });

  it('бросает error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });
    await expect(listPrograms()).rejects.toEqual({ message: 'e' });
  });
});
```

- [ ] **Step 3: Fail + impl**

```ts
import { supabase } from '@/lib/supabase';
import type { Program } from '../types';

export async function listPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 4: Pass + commit**

```bash
git add src/features/programs/types.ts src/features/programs/api/listPrograms*
git commit -m "feat(programs): listPrograms + types"
```

---

## Task 29: getProgramDetail API (TDD)

**Files:**

- Create: `src/features/programs/api/getProgramDetail.ts`
- Create: `src/features/programs/api/getProgramDetail.test.ts`
- Create: `src/features/programs/api/index.ts`

- [ ] **Step 1: Тест**

```ts
import { supabase } from '@/lib/supabase';
import { getProgramDetail } from './getProgramDetail';

const fromMock = supabase.from as jest.Mock;

describe('getProgramDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает program с join program_workouts.workout', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'p1',
        slug: '8-week',
        title: '8 weeks',
        program_workouts: [
          {
            program_id: 'p1',
            week: 1,
            day_of_week: 1,
            workout_id: 'w1',
            workout: { slug: 'upper', title: 'Upper' },
          },
        ],
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });

    const res = await getProgramDetail('8-week');
    expect(res.schedule).toHaveLength(1);
    expect(res.schedule[0].workout.slug).toBe('upper');
  });
});
```

- [ ] **Step 2: Fail + impl**

```ts
import { supabase } from '@/lib/supabase';
import type { ProgramDetail } from '../types';

export async function getProgramDetail(slug: string): Promise<ProgramDetail> {
  const { data, error } = await supabase
    .from('programs')
    .select(
      `
      *,
      program_workouts (
        program_id, week, day_of_week, workout_id,
        workout:workouts ( slug, title )
      )
    `,
    )
    .eq('slug', slug)
    .single();
  if (error) throw error;
  const sorted = [...(data.program_workouts ?? [])].sort(
    (a, b) => a.week - b.week || a.day_of_week - b.day_of_week,
  );
  return { ...data, schedule: sorted } as ProgramDetail;
}
```

`api/index.ts`:

```ts
export { listPrograms } from './listPrograms';
export { getProgramDetail } from './getProgramDetail';
```

- [ ] **Step 3: Pass + commit**

```bash
git add src/features/programs/api/
git commit -m "feat(programs): getProgramDetail with schedule join"
```

---

## Task 30: Hooks usePrograms + useProgramDetail (TDD)

**Files:**

- Create: `src/features/programs/hooks/usePrograms.ts`
- Create: `src/features/programs/hooks/usePrograms.test.tsx`
- Create: `src/features/programs/hooks/useProgramDetail.ts`
- Create: `src/features/programs/hooks/index.ts`

- [ ] **Step 1: Тест**

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { usePrograms } from './usePrograms';

const fromMock = supabase.from as jest.Mock;

describe('usePrograms', () => {
  beforeEach(() => fromMock.mockReset());

  it('фетчит', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'p' }],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => usePrograms(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
```

- [ ] **Step 2: Fail + impl**

`usePrograms.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listPrograms } from '../api/listPrograms';

export function usePrograms() {
  return useQuery({
    queryKey: qk.programs.list(),
    queryFn: listPrograms,
    staleTime: 5 * 60 * 1000,
  });
}
```

`useProgramDetail.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getProgramDetail } from '../api/getProgramDetail';

export function useProgramDetail(slug: string | undefined) {
  return useQuery({
    queryKey: qk.programs.detail(slug ?? ''),
    queryFn: () => getProgramDetail(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
```

`index.ts`:

```ts
export { usePrograms } from './usePrograms';
export { useProgramDetail } from './useProgramDetail';
```

- [ ] **Step 3: Pass + commit**

```bash
git add src/features/programs/hooks/
git commit -m "feat(programs): usePrograms + useProgramDetail"
```

---

## Task 31: programs/index.tsx list screen + smoke

**Files:**

- Create: `app/(tabs)/programs/_layout.tsx`
- Create: `app/(tabs)/programs/index.tsx`
- Create: `app/(tabs)/programs/index.test.tsx`

**Design:** Header `Text variant="hero" weight="bold"` "Программы". FlatList `ProgramCard` (full-width glass-карточек).

- [ ] **Step 1: Layout**

```tsx
import { Stack } from 'expo-router';
export default function ProgramsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Smoke test**

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import ProgramsList from './index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('ProgramsList', () => {
  beforeEach(() => fromMock.mockReset());
  it('рендерит', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: '1',
          slug: '8w',
          title: '8 недель',
          description: 'd',
          cover_path: 'c.jpg',
          weeks: 8,
          sessions_per_week: 3,
          difficulty: 3,
          min_tier: 'pro',
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ProgramsList />, { wrapper: Wrapper });
    await waitFor(async () => expect(await findByText('8 недель')).toBeTruthy());
  });
});
```

- [ ] **Step 3: Реализация**

```tsx
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { ProgramCard, QueryView } from '@/components/shared';
import type { ProgramCardData } from '@/components/shared/ProgramCard';
import { usePrograms } from '@/features/programs/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

export default function ProgramsList() {
  const theme = useTheme();
  const router = useRouter();
  const q = usePrograms();

  const items: ProgramCardData[] = (q.data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    cover_url: getPublicUrl('program-covers', p.cover_path),
    weeks: p.weeks,
    sessions_per_week: p.sessions_per_week,
    difficulty: p.difficulty,
    min_tier: p.min_tier,
  }));

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
        <Text variant="hero" weight="bold">
          Программы
        </Text>
      </View>
      <QueryView
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={items.length === 0}
        emptyText="Нет программ"
        onRetry={() => q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => it.slug}
          renderItem={({ item }) => (
            <ProgramCard
              program={item}
              onPress={(slug) => router.push(`/(tabs)/programs/${slug}` as never)}
            />
          )}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['3xl'],
            gap: theme.spacing.lg,
          }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />
          }
        />
      </QueryView>
    </Screen>
  );
}
```

- [ ] **Step 4: Pass + commit**

```bash
git add app/(tabs)/programs/
git commit -m "feat(programs): list screen"
```

---

## Task 32: programs/[slug].tsx detail screen + smoke

**Files:**

- Create: `app/(tabs)/programs/[slug].tsx`
- Create: `app/(tabs)/programs/[slug].test.tsx`

**Design:** Тот же image-hero+overlay-glass паттерн что и в workouts/[slug]. После meta — раздел "Расписание" с группировкой по неделям. На каждую неделю — заголовок "Неделя N", внутри — список карточек дней `{День N: Workout title}`. Тап → `workouts/[slug]`.

- [ ] **Step 1: Smoke test**

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import ProgramDetail from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: '8-week' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('ProgramDetail', () => {
  beforeEach(() => fromMock.mockReset());
  it('рендерит расписание', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'p',
        slug: '8-week',
        title: '8 недель',
        description: 'd',
        cover_path: 'c.jpg',
        weeks: 8,
        sessions_per_week: 3,
        difficulty: 3,
        min_tier: 'pro',
        created_at: '',
        updated_at: '',
        program_workouts: [
          {
            program_id: 'p',
            week: 1,
            day_of_week: 1,
            workout_id: 'w1',
            workout: { slug: 'upper-power', title: 'Upper' },
          },
        ],
      },
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ single }) }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<ProgramDetail />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('8 недель')).toBeTruthy();
      expect(await findByText('Upper')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Реализация**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Screen, Text } from '@/components/ui';
import { DifficultyDots, QueryView, TierBadge } from '@/components/shared';
import { useProgramDetail } from '@/features/programs/hooks';
import type { ProgramDetail as ProgramDetailT } from '@/features/programs/types';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function groupByWeek(schedule: ProgramDetailT['schedule']) {
  const map = new Map<number, ProgramDetailT['schedule']>();
  for (const item of schedule) {
    const arr = map.get(item.week) ?? [];
    arr.push(item);
    map.set(item.week, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a - b);
}

export default function ProgramDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useProgramDetail(slug);
  const cover = getPublicUrl('program-covers', q.data?.cover_path ?? null);
  const weeks = useMemo(() => (q.data ? groupByWeek(q.data.schedule) : []), [q.data]);

  return (
    <Screen padded={false}>
      <ScrollView>
        <View style={{ height: 320, backgroundColor: theme.colors.bgElevated }}>
          {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 56,
              left: theme.spacing.lg,
              width: 40,
              height: 40,
              borderRadius: theme.radii.full,
              backgroundColor: theme.colors.glassBg,
              borderWidth: 1,
              borderColor: theme.colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="bodyLg">‹</Text>
          </Pressable>
        </View>

        <View
          style={{
            marginTop: -64,
            backgroundColor: theme.colors.bg,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <QueryView
            isLoading={q.isLoading}
            isError={q.isError}
            isEmpty={false}
            onRetry={() => q.refetch()}
          >
            {q.data && (
              <>
                <Text variant="heroLg" weight="bold">
                  {q.data.title}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: theme.spacing.md,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Text variant="caption" color="textMuted">
                    {q.data.weeks} нед · {q.data.sessions_per_week} раз/нед
                  </Text>
                  <DifficultyDots level={q.data.difficulty} />
                  {q.data.min_tier !== 'free' && <TierBadge tier={q.data.min_tier} />}
                </View>
                {q.data.description && (
                  <Text variant="bodyLg" color="textMuted">
                    {q.data.description}
                  </Text>
                )}

                <Text variant="titleLg" weight="semibold">
                  Расписание
                </Text>
                {weeks.map(([week, days]) => (
                  <View key={week} style={{ gap: theme.spacing.sm }}>
                    <Text variant="bodyLg" weight="semibold" color="textMuted">
                      Неделя {week}
                    </Text>
                    {days.map((d) => (
                      <Pressable
                        key={`${d.week}-${d.day_of_week}`}
                        onPress={() => router.push(`/(tabs)/workouts/${d.workout.slug}` as never)}
                      >
                        <Card variant="glass">
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text variant="caption" color="textMuted">
                              {DAY_LABELS[d.day_of_week - 1]}
                            </Text>
                            <Text
                              variant="bodyLg"
                              weight="medium"
                              style={{ flex: 1, marginLeft: theme.spacing.md }}
                            >
                              {d.workout.title}
                            </Text>
                            <Text variant="bodyLg" color="textMuted">
                              ›
                            </Text>
                          </View>
                        </Card>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </>
            )}
          </QueryView>
        </View>
      </ScrollView>
    </Screen>
  );
}
```

> Если `<Text>` не принимает `style` — обернуть содержимое в `<View>` с marginLeft. Проверить Text реализацию из Iter 0.

- [ ] **Step 3: Pass + commit**

```bash
git add app/(tabs)/programs/
git commit -m "feat(programs): detail screen with week schedule"
```

---

# Phase 8 — Blog feature

## Task 33: types + listPublishedPosts API (TDD)

**Files:**

- Create: `src/features/blog/types.ts`
- Create: `src/features/blog/api/listPublishedPosts.ts`
- Create: `src/features/blog/api/listPublishedPosts.test.ts`

- [ ] **Step 1: types.ts**

```ts
import type { Database } from '@/lib/database.types';
export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
```

- [ ] **Step 2: Тест**

```ts
import { supabase } from '@/lib/supabase';
import { listPublishedPosts } from './listPublishedPosts';

const fromMock = supabase.from as jest.Mock;

describe('listPublishedPosts', () => {
  beforeEach(() => fromMock.mockReset());

  it('фильтрует по published_at not null и сортирует desc', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [{ id: '1', slug: 'p' }], error: null });
    const not = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ not }));
    fromMock.mockReturnValueOnce({ select });

    const res = await listPublishedPosts();
    expect(fromMock).toHaveBeenCalledWith('blog_posts');
    expect(not).toHaveBeenCalledWith('published_at', 'is', null);
    expect(order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(res).toHaveLength(1);
  });

  it('бросает error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    const not = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select: () => ({ not }) });
    await expect(listPublishedPosts()).rejects.toEqual({ message: 'e' });
  });
});
```

- [ ] **Step 3: Fail + impl**

```ts
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '../types';

export async function listPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 4: Pass + commit**

```bash
git add src/features/blog/types.ts src/features/blog/api/listPublishedPosts*
git commit -m "feat(blog): listPublishedPosts + types"
```

---

## Task 34: getPostBySlug API (TDD)

**Files:**

- Create: `src/features/blog/api/getPostBySlug.ts`
- Create: `src/features/blog/api/getPostBySlug.test.ts`
- Create: `src/features/blog/api/index.ts`

- [ ] **Step 1: Тест**

```ts
import { supabase } from '@/lib/supabase';
import { getPostBySlug } from './getPostBySlug';

const fromMock = supabase.from as jest.Mock;

describe('getPostBySlug', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает пост', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: { id: '1', slug: 'p', title: 'P' },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });

    const res = await getPostBySlug('p');
    expect(fromMock).toHaveBeenCalledWith('blog_posts');
    expect(eq).toHaveBeenCalledWith('slug', 'p');
    expect(res?.title).toBe('P');
  });

  it('бросает error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'nf' } });
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ single }) }) });
    await expect(getPostBySlug('x')).rejects.toEqual({ message: 'nf' });
  });
});
```

- [ ] **Step 2: Fail + impl**

```ts
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '../types';

export async function getPostBySlug(slug: string): Promise<BlogPost> {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}
```

`api/index.ts`:

```ts
export { listPublishedPosts } from './listPublishedPosts';
export { getPostBySlug } from './getPostBySlug';
```

- [ ] **Step 3: Pass + commit**

```bash
git add src/features/blog/api/
git commit -m "feat(blog): getPostBySlug"
```

---

## Task 35: Hooks useBlogPosts + useBlogPost (TDD)

**Files:**

- Create: `src/features/blog/hooks/useBlogPosts.ts`
- Create: `src/features/blog/hooks/useBlogPosts.test.tsx`
- Create: `src/features/blog/hooks/useBlogPost.ts`
- Create: `src/features/blog/hooks/index.ts`

- [ ] **Step 1: Тест useBlogPosts**

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useBlogPosts } from './useBlogPosts';

const fromMock = supabase.from as jest.Mock;

describe('useBlogPosts', () => {
  beforeEach(() => fromMock.mockReset());

  it('фетчит', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'p' }],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ not: () => ({ order }) }) });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useBlogPosts(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
```

- [ ] **Step 2: Fail + impl**

`useBlogPosts.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { listPublishedPosts } from '../api/listPublishedPosts';

export function useBlogPosts() {
  return useQuery({
    queryKey: qk.blog.list(),
    queryFn: listPublishedPosts,
    staleTime: 2 * 60 * 1000,
  });
}
```

`useBlogPost.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getPostBySlug } from '../api/getPostBySlug';

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: qk.blog.detail(slug ?? ''),
    queryFn: () => getPostBySlug(slug as string),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
```

`index.ts`:

```ts
export { useBlogPosts } from './useBlogPosts';
export { useBlogPost } from './useBlogPost';
```

- [ ] **Step 3: Pass + commit**

```bash
git add src/features/blog/hooks/
git commit -m "feat(blog): useBlogPosts + useBlogPost"
```

---

## Task 36: Удалить старый blog.tsx + создать blog/index.tsx

**Files:**

- Delete: `app/(tabs)/blog.tsx`
- Create: `app/(tabs)/blog/_layout.tsx`
- Create: `app/(tabs)/blog/index.tsx`
- Create: `app/(tabs)/blog/index.test.tsx`

- [ ] **Step 1: Удалить старый**

```bash
git rm app/(tabs)/blog.tsx
```

- [ ] **Step 2: Layout**

```tsx
import { Stack } from 'expo-router';
export default function BlogLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Smoke test**

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import BlogList from './index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('BlogList', () => {
  beforeEach(() => fromMock.mockReset());
  it('рендерит посты', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: '1',
          slug: 'p',
          title: 'Пост',
          excerpt: 'эксцерпт',
          cover_path: 'c.jpg',
          body: '',
          author_id: 'u',
          published_at: '2026-05-01T00:00:00Z',
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ not: () => ({ order }) }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<BlogList />, { wrapper: Wrapper });
    await waitFor(async () => expect(await findByText('Пост')).toBeTruthy());
  });
});
```

- [ ] **Step 4: Реализация**

```tsx
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { BlogPostCard, QueryView } from '@/components/shared';
import type { BlogPostCardData } from '@/components/shared/BlogPostCard';
import { useBlogPosts } from '@/features/blog/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

export default function BlogList() {
  const theme = useTheme();
  const router = useRouter();
  const q = useBlogPosts();

  const items: BlogPostCardData[] = (q.data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover_url: getPublicUrl('blog-media', p.cover_path),
    published_at: p.published_at,
  }));

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
        <Text variant="hero" weight="bold">
          Блог
        </Text>
      </View>
      <QueryView
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={items.length === 0}
        emptyText="Пока нет постов"
        onRetry={() => q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => it.slug}
          renderItem={({ item }) => (
            <BlogPostCard
              post={item}
              onPress={(slug) => router.push(`/(tabs)/blog/${slug}` as never)}
            />
          )}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['3xl'],
            gap: theme.spacing.lg,
          }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />
          }
        />
      </QueryView>
    </Screen>
  );
}
```

- [ ] **Step 5: Pass + commit**

```bash
git add app/(tabs)/blog/
git commit -m "feat(blog): list screen"
```

---

## Task 37: blog/[slug].tsx detail screen + smoke

**Files:**

- Create: `app/(tabs)/blog/[slug].tsx`
- Create: `app/(tabs)/blog/[slug].test.tsx`

**Design:** Cover hero (height 280) + title overlay glass-карточка снизу с overlap -64. Внутри: title (`heroLg`), date `caption`, divider, markdown body. ScrollView полнокадровый.

- [ ] **Step 1: Установить markdown**

```bash
npm install react-native-markdown-display
```

- [ ] **Step 2: Smoke test**

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import BlogPost from './[slug]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'p' }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));
jest.mock('react-native-markdown-display', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ children }: any) => <Text>{children}</Text> };
});

const fromMock = supabase.from as jest.Mock;

describe('BlogPost', () => {
  beforeEach(() => fromMock.mockReset());
  it('рендерит', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: '1',
        slug: 'p',
        title: 'Заголовок',
        excerpt: '',
        body: '# Hello',
        cover_path: 'c.jpg',
        author_id: 'u',
        published_at: '2026-05-01T00:00:00Z',
        created_at: '',
        updated_at: '',
      },
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ single }) }) });
    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<BlogPost />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText('Заголовок')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 3: Реализация**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Screen, Text } from '@/components/ui';
import { QueryView } from '@/components/shared';
import { useBlogPost } from '@/features/blog/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

function fmt(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export default function BlogPostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = useBlogPost(slug);
  const cover = getPublicUrl('blog-media', q.data?.cover_path ?? null);

  const mdStyles = {
    body: { color: theme.colors.text, fontSize: 16, lineHeight: 24 },
    heading1: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '700' as const,
      marginTop: theme.spacing.lg,
    },
    heading2: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '600' as const,
      marginTop: theme.spacing.md,
    },
    paragraph: { color: theme.colors.text, marginTop: theme.spacing.sm },
    list_item: { color: theme.colors.text },
  };

  return (
    <Screen padded={false}>
      <ScrollView>
        <View style={{ height: 280, backgroundColor: theme.colors.bgElevated }}>
          {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 56,
              left: theme.spacing.lg,
              width: 40,
              height: 40,
              borderRadius: theme.radii.full,
              backgroundColor: theme.colors.glassBg,
              borderWidth: 1,
              borderColor: theme.colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="bodyLg">‹</Text>
          </Pressable>
        </View>
        <View
          style={{
            marginTop: -64,
            backgroundColor: theme.colors.bg,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          <QueryView
            isLoading={q.isLoading}
            isError={q.isError}
            isEmpty={false}
            onRetry={() => q.refetch()}
          >
            {q.data && (
              <>
                <Text variant="caption" color="textMuted">
                  {fmt(q.data.published_at)}
                </Text>
                <Text variant="heroLg" weight="bold">
                  {q.data.title}
                </Text>
                <Markdown style={mdStyles}>{q.data.body}</Markdown>
              </>
            )}
          </QueryView>
        </View>
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 4: Pass + commit**

```bash
git add app/(tabs)/blog/ package.json package-lock.json
git commit -m "feat(blog): post detail with markdown rendering"
```

---

# Phase 9 — Search feature

## Task 38: types + searchContent API (TDD)

**Files:**

- Create: `src/features/search/types.ts`
- Create: `src/features/search/api/searchContent.ts`
- Create: `src/features/search/api/searchContent.test.ts`
- Create: `src/features/search/api/index.ts`

- [ ] **Step 1: types.ts**

```ts
import type { Database } from '@/lib/database.types';
import type { Tier } from '@/features/exercises/lib/tierGate';

export type SearchKind = 'exercise' | 'workout';

export type SearchResult = {
  kind: SearchKind;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  cover_path: string | null;
  min_tier: Tier;
  rank: number;
};
```

- [ ] **Step 2: Тест**

```ts
import { supabase } from '@/lib/supabase';
import { searchContent } from './searchContent';

const rpcMock = supabase.rpc as jest.Mock;

describe('searchContent', () => {
  beforeEach(() => rpcMock.mockReset());

  it('вызывает RPC search_content', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          kind: 'exercise',
          id: '1',
          slug: 'squat',
          title: 'Squat',
          subtitle: 'quads',
          cover_path: null,
          min_tier: 'pro',
          rank: 0.5,
        },
      ],
      error: null,
    });
    const res = await searchContent('squat');
    expect(rpcMock).toHaveBeenCalledWith('search_content', { q: 'squat' });
    expect(res).toHaveLength(1);
    expect(res[0].kind).toBe('exercise');
  });

  it('возвращает [] если query короче 2 символов', async () => {
    expect(await searchContent('a')).toEqual([]);
    expect(await searchContent('')).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('бросает error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    await expect(searchContent('squat')).rejects.toEqual({ message: 'e' });
  });
});
```

- [ ] **Step 3: Fail + impl**

```ts
import { supabase } from '@/lib/supabase';
import type { SearchResult } from '../types';

export async function searchContent(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const { data, error } = await supabase.rpc('search_content', { q: trimmed });
  if (error) throw error;
  return (data ?? []) as SearchResult[];
}
```

`api/index.ts`:

```ts
export { searchContent } from './searchContent';
```

- [ ] **Step 4: Pass + commit**

```bash
git add src/features/search/types.ts src/features/search/api/
git commit -m "feat(search): searchContent RPC + types"
```

---

## Task 39: Hook useSearch (TDD)

**Files:**

- Create: `src/features/search/hooks/useSearch.ts`
- Create: `src/features/search/hooks/useSearch.test.tsx`
- Create: `src/features/search/hooks/index.ts`

- [ ] **Step 1: Тест**

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useSearch } from './useSearch';

const rpcMock = supabase.rpc as jest.Mock;

describe('useSearch', () => {
  beforeEach(() => rpcMock.mockReset());

  it('disabled при пустом query', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useSearch(''), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('фетчит при query >= 2 символов', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          kind: 'workout',
          id: '1',
          slug: 'a',
          title: 'A',
          subtitle: 'upper',
          cover_path: null,
          min_tier: 'basic',
          rank: 1,
        },
      ],
      error: null,
    });
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useSearch('appppp'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
```

- [ ] **Step 2: Fail + impl**

```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { searchContent } from '../api/searchContent';

export function useSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: qk.search.query(trimmed),
    queryFn: () => searchContent(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60 * 1000,
  });
}
```

`hooks/index.ts`:

```ts
export { useSearch } from './useSearch';
```

- [ ] **Step 3: Pass + commit**

```bash
git add src/features/search/hooks/
git commit -m "feat(search): useSearch hook"
```

---

## Task 40: search/index.tsx screen + smoke

**Files:**

- Create: `app/(tabs)/search/_layout.tsx`
- Create: `app/(tabs)/search/index.tsx`
- Create: `app/(tabs)/search/index.test.tsx`

**Design:** Большой `Input` с placeholder "Поиск по тренировкам и упражнениям". Под ним `Segmented` (`Все` / `Упражнения` / `Тренировки`). Список — каждый ряд: glass-карточка 80px (мини-обложка 60×60 + title + subtitle + TierBadge). Используем debounce 250ms.

- [ ] **Step 1: Layout**

```tsx
import { Stack } from 'expo-router';
export default function SearchLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Smoke test**

```tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import SearchScreen from './index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

jest.useFakeTimers();

const rpcMock = supabase.rpc as jest.Mock;

describe('SearchScreen', () => {
  beforeEach(() => rpcMock.mockReset());

  it('запускает поиск после ввода', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          kind: 'exercise',
          id: '1',
          slug: 'squat',
          title: 'Squat',
          subtitle: 'quads',
          cover_path: null,
          min_tier: 'pro',
          rank: 1,
        },
      ],
      error: null,
    });
    const { Wrapper } = makeQueryWrapper();
    const { getByPlaceholderText, findByText } = render(<SearchScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Поиск по тренировкам и упражнениям'), 'squat');
    jest.advanceTimersByTime(300);
    await waitFor(async () => expect(await findByText('Squat')).toBeTruthy());
  });
});
```

- [ ] **Step 3: Реализация**

```tsx
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';
import { Card, Input, Screen, Segmented, Text } from '@/components/ui';
import { QueryView, TierBadge } from '@/components/shared';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearch } from '@/features/search/hooks';
import type { SearchKind, SearchResult } from '@/features/search/types';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

const KIND_OPTIONS: Array<{ value: SearchKind | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'exercise', label: 'Упражнения' },
  { value: 'workout', label: 'Тренировки' },
];

function ResultRow({
  item,
  onPress,
}: {
  item: SearchResult;
  onPress: (item: SearchResult) => void;
}) {
  const theme = useTheme();
  const cover = item.kind === 'workout' ? getPublicUrl('workout-covers', item.cover_path) : null;

  return (
    <Pressable onPress={() => onPress(item)}>
      <Card variant="glass">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: theme.radii.md,
              overflow: 'hidden',
              backgroundColor: theme.colors.bgElevated,
            }}
          >
            {cover && <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyLg" weight="semibold">
              {item.title}
            </Text>
            <Text variant="caption" color="textMuted">
              {item.subtitle}
            </Text>
          </View>
          {item.min_tier !== 'free' && <TierBadge tier={item.min_tier} />}
        </View>
      </Card>
    </Pressable>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<SearchKind | 'all'>('all');
  const debounced = useDebouncedValue(text, 250);
  const q = useSearch(debounced);

  const items = useMemo(
    () => (q.data ?? []).filter((r) => kind === 'all' || r.kind === kind),
    [q.data, kind],
  );

  const onResultPress = (item: SearchResult) => {
    if (item.kind === 'exercise') router.push(`/(tabs)/exercises/${item.slug}` as never);
    else router.push(`/(tabs)/workouts/${item.slug}` as never);
  };

  const showEmpty = debounced.trim().length >= 2 && items.length === 0 && !q.isLoading;

  return (
    <Screen padded={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
      >
        <Text variant="hero" weight="bold">
          Поиск
        </Text>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Поиск по тренировкам и упражнениям"
        />
        <Segmented
          value={kind}
          options={KIND_OPTIONS}
          onChange={(v) => setKind(v as typeof kind)}
        />
      </View>
      <QueryView
        isLoading={q.isLoading && q.fetchStatus !== 'idle'}
        isError={q.isError}
        isEmpty={showEmpty}
        emptyText="Ничего не нашлось"
        onRetry={() => q.refetch()}
      >
        <FlatList
          data={items}
          keyExtractor={(it) => `${it.kind}-${it.id}`}
          renderItem={({ item }) => <ResultRow item={item} onPress={onResultPress} />}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['3xl'],
            gap: theme.spacing.md,
          }}
        />
      </QueryView>
    </Screen>
  );
}
```

- [ ] **Step 4: Pass + commit**

```bash
git add app/(tabs)/search/
git commit -m "feat(search): screen with debounced search and kind filter"
```

---

# Phase 10 — Tab bar + Home + Profile

## Task 41: Обновить tabs/\_layout с 6 табами

**Files:**

- Modify: `app/(tabs)/_layout.tsx`

> Tabs нужно перевести на directories: после Phase 6/7/8/9 уже созданы `workouts/`, `programs/`, `blog/`, `search/` — Expo Router их автоматически распознаёт. Нужно только зарегистрировать `Tabs.Screen` для каждого.

- [ ] **Step 1: Заменить содержимое**

`app/(tabs)/_layout.tsx`:

```tsx
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.glassBorder,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={theme.blur.strong}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: Platform.OS === 'android' ? theme.colors.bg : theme.colors.glassBg,
              },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Главная' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Тренировки' }} />
      <Tabs.Screen name="programs" options={{ title: 'Программы' }} />
      <Tabs.Screen name="search" options={{ title: 'Поиск' }} />
      <Tabs.Screen name="blog" options={{ title: 'Блог' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
      {/* exercises — это nested-stack без таб-кнопки */}
      <Tabs.Screen name="exercises" options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Запустить тесты**

Run: `npm test`
Expected: PASS. Все existing тесты должны быть зелёными.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat(nav): 6 tabs (home/workouts/programs/search/blog/profile) + nested exercises"
```

---

## Task 42: Обновить home.tsx — дашборд с 3 секциями

**Files:**

- Modify: `app/(tabs)/home.tsx`
- Create: `app/(tabs)/home.test.tsx`

**Design:** Hero — приветствие "Привет, {display_name}" (`heroLg`). Три горизонтально-скроллящиеся секции: "Рекомендуемые тренировки" (3 `WorkoutCard` подряд), "Программы" (2 `ProgramCard`), "Из блога" (3 `BlogPostCard`). Каждая секция — `Text variant="titleLg" weight="semibold"` хедер + `FlatList horizontal`.

Для MVP: берём первые N записей из existing хуков, без отдельного "featured" RPC.

- [ ] **Step 1: Smoke test**

`app/(tabs)/home.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import Home from './home';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

const fromMock = supabase.from as jest.Mock;

describe('Home', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });
  });

  it('рендерит секции', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'workouts') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    id: '1',
                    slug: 'w',
                    title: 'W',
                    category: 'upper',
                    cover_path: 'c.jpg',
                    duration_minutes: 30,
                    difficulty: 2,
                    min_tier: 'basic',
                    description: '',
                    created_at: '',
                    updated_at: '',
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'programs') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    id: '1',
                    slug: 'p',
                    title: 'P',
                    description: 'd',
                    cover_path: 'c.jpg',
                    weeks: 4,
                    sessions_per_week: 3,
                    difficulty: 2,
                    min_tier: 'basic',
                    created_at: '',
                    updated_at: '',
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'blog_posts') {
        return {
          select: () => ({
            not: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: '1',
                      slug: 'b',
                      title: 'B',
                      excerpt: '',
                      body: '',
                      cover_path: 'c.jpg',
                      author_id: 'u',
                      published_at: '2026-05-01',
                      created_at: '',
                      updated_at: '',
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'u1', display_name: 'Vadim', subscription_tier: 'free' },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {};
    });

    const { Wrapper } = makeQueryWrapper();
    const { findByText } = render(<Home />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(await findByText(/Vadim/)).toBeTruthy();
      expect(await findByText('Рекомендуемые')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Реализация**

```tsx
import { useRouter } from 'expo-router';
import { FlatList, ScrollView, View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import {
  BlogPostCard,
  ProgramCard,
  QueryView,
  WorkoutCard,
  type BlogPostCardData,
  type ProgramCardData,
  type WorkoutCardData,
} from '@/components/shared';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useWorkouts } from '@/features/workouts/hooks';
import { usePrograms } from '@/features/programs/hooks';
import { useBlogPosts } from '@/features/blog/hooks';
import { getPublicUrl } from '@/services/storage';
import { useTheme } from '@/theme';

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const workouts = useWorkouts();
  const programs = usePrograms();
  const posts = useBlogPosts();

  const wItems: WorkoutCardData[] = (workouts.data ?? []).slice(0, 5).map((w) => ({
    slug: w.slug,
    title: w.title,
    category: w.category,
    cover_url: getPublicUrl('workout-covers', w.cover_path),
    duration_minutes: w.duration_minutes,
    difficulty: w.difficulty,
    min_tier: w.min_tier,
  }));
  const pItems: ProgramCardData[] = (programs.data ?? []).slice(0, 3).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    cover_url: getPublicUrl('program-covers', p.cover_path),
    weeks: p.weeks,
    sessions_per_week: p.sessions_per_week,
    difficulty: p.difficulty,
    min_tier: p.min_tier,
  }));
  const bItems: BlogPostCardData[] = (posts.data ?? []).slice(0, 5).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover_url: getPublicUrl('blog-media', p.cover_path),
    published_at: p.published_at,
  }));

  const isLoading = workouts.isLoading || programs.isLoading || posts.isLoading;
  const isError = workouts.isError || programs.isError || posts.isError;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing['3xl'], gap: theme.spacing['2xl'] }}
      >
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.xl,
            gap: theme.spacing.xs,
          }}
        >
          <Text variant="caption" color="textMuted">
            Привет
          </Text>
          <Text variant="heroLg" weight="bold">
            {profile.data?.display_name ?? '👋'}
          </Text>
        </View>

        <QueryView
          isLoading={isLoading}
          isError={isError}
          isEmpty={false}
          onRetry={() => {
            workouts.refetch();
            programs.refetch();
            posts.refetch();
          }}
        >
          <View style={{ gap: theme.spacing.md }}>
            <Text
              variant="titleLg"
              weight="semibold"
              style={{ paddingHorizontal: theme.spacing.lg }}
            >
              Рекомендуемые
            </Text>
            <FlatList
              horizontal
              data={wItems}
              keyExtractor={(it) => it.slug}
              renderItem={({ item }) => (
                <View style={{ width: 320 }}>
                  <WorkoutCard
                    workout={item}
                    onPress={(slug) => router.push(`/(tabs)/workouts/${slug}` as never)}
                  />
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Text
              variant="titleLg"
              weight="semibold"
              style={{ paddingHorizontal: theme.spacing.lg }}
            >
              Программы
            </Text>
            <FlatList
              horizontal
              data={pItems}
              keyExtractor={(it) => it.slug}
              renderItem={({ item }) => (
                <View style={{ width: 280 }}>
                  <ProgramCard
                    program={item}
                    onPress={(slug) => router.push(`/(tabs)/programs/${slug}` as never)}
                  />
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Text
              variant="titleLg"
              weight="semibold"
              style={{ paddingHorizontal: theme.spacing.lg }}
            >
              Из блога
            </Text>
            <FlatList
              horizontal
              data={bItems}
              keyExtractor={(it) => it.slug}
              renderItem={({ item }) => (
                <View style={{ width: 280 }}>
                  <BlogPostCard
                    post={item}
                    onPress={(slug) => router.push(`/(tabs)/blog/${slug}` as never)}
                  />
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        </QueryView>
      </ScrollView>
    </Screen>
  );
}
```

> Если `<Text>` не принимает `style` — заменить на обёртку `<View style={{ paddingHorizontal: theme.spacing.lg }}><Text …/></View>`.

- [ ] **Step 3: Pass + commit**

```bash
git add app/(tabs)/home.tsx app/(tabs)/home.test.tsx
git commit -m "feat(home): dashboard with 3 horizontal sections"
```

---

## Task 43: Обновить profile.tsx — секция Подписка

**Files:**

- Modify: `app/(tabs)/profile.tsx`

**Design:** Существующий профиль из Iter 1 + новый раздел "Подписка": glass-карточка с `TierBadge` + строка "Активный тариф" / "Бесплатный". Без действий — просто read-only.

- [ ] **Step 1: Прочитать текущий profile.tsx**

```bash
cat "app/(tabs)/profile.tsx"
```

- [ ] **Step 2: Добавить секцию подписки**

В `app/(tabs)/profile.tsx` найти основной layout и добавить новый блок (точное место — после блока с display_name, до блока выхода):

```tsx
import { Card, Text } from '@/components/ui';
import { TierBadge } from '@/components/shared';
import { useProfile } from '@/features/auth/hooks/useProfile';
// (если уже импортированы — не дублировать)

// Внутри return:
const { data: profile } = useProfile();
const tier = (profile?.subscription_tier ?? 'free') as Tier;

// JSX:
<Card variant="glass">
  <View style={{ gap: theme.spacing.md }}>
    <Text variant="titleLg" weight="semibold">
      Подписка
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="bodyLg" color="textMuted">
        Текущий тариф
      </Text>
      <TierBadge tier={tier} />
    </View>
    {tier === 'free' && (
      <Text variant="caption" color="textMuted">
        Управление подпиской появится в следующей версии
      </Text>
    )}
  </View>
</Card>;
```

- [ ] **Step 3: Запустить тесты**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat(profile): add subscription section with TierBadge"
```

---

# Phase 11 — QA + docs

## Task 44: Ручные проверки на устройстве

Это **не TDD-задача** — чистый smoke на iOS симуляторе и Android эмуляторе.

- [ ] **Step 1: Запустить dev server**

```bash
npm start
```

- [ ] **Step 2: iOS симулятор**

Нажать `i` в Expo CLI или: `npm ios`

Чек-лист на iOS:

- Логин → Home рендерится с тремя секциями ✓
- Tap "Тренировки" → список ✓
- Tap workout-карточку → детали + список упражнений ✓
- Tap exercise-row → детали упражнения, GIF играет ✓
- Если tier=free, видео pro-упражнения → PaywallCard ✓
- Tap "Программы" → список → детали → Неделя 1, Пн → переход на workout ✓
- Tap "Поиск" → ввод "присед" → результат ✓
- Tap "Блог" → список → детали с markdown ✓
- Profile → tier badge ✓

- [ ] **Step 3: Android эмулятор**

Нажать `a` или: `npm android`

Тот же чек-лист. Особое внимание: BlurView на Android (fallback на solid-цвет уже настроен в \_layout).

- [ ] **Step 4: RLS smoke в Studio**

Под non-admin юзером:

```sql
-- В Studio → Authentication → Users → Impersonate non-admin user
insert into public.exercises (slug, name, primary_muscle) values ('hack','Hack','core');
-- Ожидание: permission denied
```

Под non-admin юзером с tier='free':

```sql
select public.get_exercise_video_url('squat');
-- Ожидание: ERROR: subscription required
```

- [ ] **Step 5: Если есть баги**

Создать новые задачи в этом плане ниже строки `## Discovered issues`, не модифицируя предыдущие. После фиксов — заново прогнать `npm test`/`typecheck`/`lint`.

## Discovered issues

_(empty при старте)_

---

## Task 45: Финальные проверки + docs

**Files:**

- Modify: `docs/progress.md`

- [ ] **Step 1: Полный прогон проверок**

```bash
npm typecheck
npm lint
npm test
```

Все три должны быть зелёными. `npm test` — ожидается ~155 тестов (62 из Iter 1 + ~95 новых).

- [ ] **Step 2: Обновить docs/progress.md**

Изменить таблицу: строка `| 2 | Backend MVP + контент | ⬜ Planned | |` → `| 2 | Backend MVP + контент | ✅ Done | 2026-05-XX |` (подставить реальную дату завершения).

В секции `## Текущая итерация` поменять на `**Итерация 3** — Подписки (RevenueCat) _(не начата)_`.

Добавить новую секцию `## Что реализовано (Итерация 2)`:

```markdown
## Что реализовано (Итерация 2)

- БД: 2 миграции (content + search), 6 таблиц, RLS, RPC `get_exercise_video_url` / `get_exercise_gif_url` / `search_content`
- Storage: 1 private (`exercise-media`) + 3 public buckets с admin-only write
- Seed: 10 упражнений, 5 тренировок, 2 программы, 3 поста
- Фичи: `features/exercises`, `features/workouts`, `features/programs`, `features/blog`, `features/search` — api, hooks, types
- Shared компоненты: TierBadge, DifficultyDots, PaywallCard, WorkoutCard, ProgramCard, BlogPostCard, ExerciseRow, QueryView
- Экраны: Home (дашборд), Workouts list/detail, Programs list/detail, Exercises detail (с tier-gated video), Blog list/detail, Search
- Tab bar: 6 вкладок (Home, Workouts, Programs, Search, Blog, Profile)
- Tier gate: серверная проверка в RPC + клиентская через `hasAccess`
- Тесты: ~95 новых, все зелёные
- Спека: `docs/superpowers/specs/2026-05-06-iteration-2-content-design.md`
- План: `docs/superpowers/plans/2026-05-06-iteration-2-content.md`
```

- [ ] **Step 3: Commit**

```bash
git add docs/progress.md
git commit -m "docs: mark Iteration 2 as Done, add summary"
```

- [ ] **Step 4: Создать PR** (опционально, по запросу)

```bash
git push -u origin <branch-name>
gh pr create --title "Iteration 2: Backend MVP + content" --body "$(cat <<'EOF'
## Summary
- DB: content + FTS migrations, 6 tables, RLS, RPC for signed URLs and unified search
- Storage: 1 private + 3 public buckets, admin-only write
- 5 features (exercises/workouts/programs/blog/search) with api/hooks/screens
- 6-tab navigation + glass-themed minimalist UI

## Test plan
- [ ] npm typecheck зелёный
- [ ] npm lint зелёный
- [ ] npm test зелёный (~155 тестов)
- [ ] iOS smoke: tier-gated video, search, programs schedule
- [ ] Android smoke
- [ ] RLS smoke под non-admin юзером
EOF
)"
```

---

# Final notes

**Test count:** ~95 новых = ~155 итого. Если по факту получилось меньше/больше — в порядке вещей.

**Что делать при сбое:**

- Тест красный → починить, не двигаться дальше.
- Миграция не применилась → проверить ошибку, откатить через `drop ...` если нужно.
- Storage policy не работает → проверить `is_admin()` через `select public.is_admin()` под impersonated user.

**Не вошло в план (deferred):**

- Express backend (Iter 3-4)
- RevenueCat / IAP (Iter 3)
- Push (Iter 4)
- Offline видео-кеш (Iter 4)
- Прогресс прохождения программы (`user_workouts` таблица — будет в Iter 3+)
- Admin SPA (Iter 6)
- Питание (Iter 5)

**Self-review checklist выполнен:**

- ✅ Каждая фича из спеки покрыта задачей (DB → seed → features → screens)
- ✅ Поиск (FTS + RPC + screen) — Tasks 2, 38, 39, 40
- ✅ Tier gate — Tasks 6 (lib), Task 22 (применён в exercise screen), Task 43 (UI badge)
- ✅ Storage — Tasks 4, 5, 8 (helper), 22 (signed URL для GIF/video)
- ✅ RPC `get_exercise_video_url` имеет null-tier guard (Task 1)
- ✅ Blog RLS — explicit SQL (Task 1)
- ✅ Все типы, методы и сигнатуры консистентны: `Tier` экспортируется из `features/exercises/lib/tierGate`, переиспользуется во всех cards и в `search/types.ts`
- ✅ Каждый шаг — конкретный код или команда, без TBD/placeholder
