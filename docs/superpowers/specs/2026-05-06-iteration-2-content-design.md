# Итерация 2 — Backend MVP + контент

## Контекст

Итерация 1 (Auth) завершена: Supabase Auth с email/phone OTP, `public.profiles` с RLS,
`useAuthStore` поверх `supabase.auth`, 62 теста зелёных.

Итерация 2 — наполнить приложение контентом: упражнения, тренировки, программы, блог,
поиск. Делаем на чистом Supabase (Postgres + Storage), без Express. Тарифные ограничения
размечаем в схеме (поле `min_tier`), но без RevenueCat — выставление tier'а для теста
руками через Supabase Studio.

> **Express отложен**: добавим в Iter 3-4, когда появится логика, требующая своего
> сервера (RevenueCat webhooks, push fan-out). До тех пор клиент ходит в Supabase напрямую.

## Решения, зафиксированные в брейнсторме

| Тема              | Решение                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Backend           | Pure Supabase. Express отложен до появления нетривиальной серверной логики                         |
| Scope контента    | Полный: упражнения + тренировки + программы + блог + поиск                                         |
| Subscription gate | Поле `min_tier` (enum) на каждой контентной таблице, столбец `subscription_tier` в `profiles`      |
| Связи моделей     | Нормализованная M:N: `program → workout → exercise` через junction-таблицы                         |
| Media             | Supabase Storage: `exercise-media` private (signed URLs через RPC), 3 public для обложек           |
| Blog              | MVP: список + детали, markdown body. Без комментариев/реакций                                      |
| Admin             | `is_admin boolean` в profiles + `public.is_admin()` helper. Контент льём через `seed.sql` + Studio |
| Поиск             | Postgres FTS (`tsvector` + GIN) по упражнениям и тренировкам через RPC `search_content`            |
| Tab bar           | 6 табов: Home / Workouts / Programs / Search / Blog / Profile                                      |

## Цели итерации

1. Миграция: enum'ы (tier/category/muscle), ALTER profiles, 6 контентных таблиц, RLS, RPC, FTS
2. Storage buckets (1 private + 3 public) с policies
3. Seed-контент: ≥10 упражнений, ≥5 тренировок, ≥2 программы, ≥3 поста блога
4. Клиентские features: exercises, workouts, programs, blog, search
5. Экраны: home (дашборд), workouts list/detail, programs list/detail, exercises detail (с видео),
   blog list/detail, search
6. Subscription gate в UI (paywall-заглушка под Iter 3)
7. ~95 новых тестов

## Tech additions

- `expo-video` — video player на экране упражнения (в SDK 54 стабилен; `expo-av` deprecated)
- `react-native-markdown-display` — рендер body постов блога

## DB схема

### Enum'ы

```sql
create type subscription_tier_enum as enum ('free', 'basic', 'pro', 'pro_max');
create type workout_category_enum as enum ('upper', 'lower', 'full_body', 'cardio', 'core');
create type muscle_group_enum as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardio'
);
```

### Изменения в `profiles`

```sql
alter table public.profiles
  add column subscription_tier subscription_tier_enum not null default 'free',
  add column is_admin boolean not null default false;
```

### Новые таблицы

| Таблица             | Ключевые поля                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `exercises`         | `slug`, `name`, `description`, `primary_muscle`, `secondary_muscles[]`, `equipment[]`, `gif_path`, `video_path`, `min_tier`                                        |
| `workouts`          | `slug`, `title`, `description`, `category`, `cover_path`, `duration_minutes`, `difficulty (1-5)`, `min_tier`                                                       |
| `workout_exercises` | PK `(workout_id, position)`. `exercise_id`, `sets`, `reps text`, `rest_seconds`, `notes`. FK exercise — RESTRICT (нельзя удалить упражнение, которое используется) |
| `programs`          | `slug`, `title`, `description`, `cover_path`, `weeks`, `sessions_per_week`, `difficulty`, `min_tier`                                                               |
| `program_workouts`  | PK `(program_id, week, day_of_week 1-7)`. FK workout — RESTRICT                                                                                                    |
| `blog_posts`        | `slug`, `title`, `excerpt`, `body (markdown)`, `cover_path`, `author_id → profiles`, `published_at` (null = draft)                                                 |

Все таблицы имеют `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at` (триггер
`set_updated_at` как в Iter 1).

### `is_admin()` helper

```sql
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
```

### RLS policies — стратегия

| Таблица      | Read                                                                                                          | Write                         |
| ------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Все контент. | `authenticated` (любой залогинен)                                                                             | `is_admin()` или service-role |
| `blog_posts` | `(auth.role() = 'authenticated' AND published_at IS NOT NULL) OR public.is_admin()` (черновики только админу) | то же что write выше          |

### RPC: signed URL для приватного видео

```sql
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
```

Аналогично — `get_exercise_gif_url(slug)` без tier-проверки (превью видно всем).

### FTS

```sql
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
```

```sql
create or replace function public.search_content(q text)
returns table (kind text, id uuid, slug text, title text, subtitle text,
               cover_path text, min_tier subscription_tier_enum, rank real)
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

## Storage

| Bucket           | Public | Назначение                            | Доступ на клиенте      |
| ---------------- | ------ | ------------------------------------- | ---------------------- |
| `exercise-media` | ❌     | GIF превью + видео техники упражнений | через signed URL (RPC) |
| `workout-covers` | ✅     | Обложки тренировок                    | прямой `getPublicUrl`  |
| `program-covers` | ✅     | Обложки программ                      | прямой `getPublicUrl`  |
| `blog-media`     | ✅     | Картинки в постах + обложки           | прямой `getPublicUrl`  |

Storage policies: read для public buckets — открыто; write/update/delete на всех bucket'ах —
только `is_admin()` или service-role.

Заливка контента в Iter 2 — вручную через Supabase Studio (Dashboard) или прогон
`supabase/seed.sql` в SQL editor. Файлы (GIF, видео, обложки) загружаем в bucket'ы
через Storage UI Studio; пути в `seed.sql` должны соответствовать загруженным файлам.

## Структура файлов после итерации

```
mobile-app/
├── app/
│   └── (tabs)/
│       ├── _layout.tsx                       # MODIFIED: +Programs, +Search табы
│       ├── home.tsx                          # MODIFIED: дашборд (3 секции)
│       ├── workouts/
│       │   ├── _layout.tsx                   # NEW: Stack
│       │   ├── index.tsx                     # NEW: список + Segmented категорий
│       │   └── [slug].tsx                    # NEW: детали + список упражнений
│       ├── programs/
│       │   ├── _layout.tsx                   # NEW
│       │   ├── index.tsx                     # NEW
│       │   └── [slug].tsx                    # NEW: недели × дни
│       ├── blog/
│       │   ├── _layout.tsx                   # NEW
│       │   ├── index.tsx                     # NEW
│       │   └── [slug].tsx                    # NEW: markdown body
│       ├── exercises/
│       │   ├── _layout.tsx                   # NEW
│       │   └── [slug].tsx                    # NEW: GIF + tier-gated video
│       ├── search/
│       │   ├── _layout.tsx                   # NEW
│       │   └── index.tsx                     # NEW: input + список результатов
│       └── profile.tsx                       # MODIFIED: + секция Подписка (read-only)
├── src/
│   ├── features/
│   │   ├── exercises/
│   │   │   ├── api/{listExercises,getExercise,getExerciseGifUrl,getExerciseVideoUrl}.ts
│   │   │   ├── hooks/{useExercises,useExercise,useExerciseVideoUrl}.ts
│   │   │   ├── lib/tierGate.ts
│   │   │   └── types.ts
│   │   ├── workouts/
│   │   │   ├── api/{listWorkouts,getWorkoutDetail}.ts
│   │   │   ├── hooks/{useWorkouts,useWorkoutDetail}.ts
│   │   │   └── types.ts
│   │   ├── programs/
│   │   │   ├── api/{listPrograms,getProgramDetail}.ts
│   │   │   ├── hooks/{usePrograms,useProgramDetail}.ts
│   │   │   └── types.ts
│   │   ├── blog/
│   │   │   ├── api/{listPublishedPosts,getPostBySlug}.ts
│   │   │   ├── hooks/{useBlogPosts,useBlogPost}.ts
│   │   │   └── types.ts
│   │   └── search/
│   │       ├── api/searchContent.ts
│   │       └── hooks/useSearch.ts
│   ├── components/shared/
│   │   ├── WorkoutCard.tsx
│   │   ├── ProgramCard.tsx
│   │   ├── BlogPostCard.tsx
│   │   ├── ExerciseRow.tsx
│   │   ├── TierBadge.tsx
│   │   ├── DifficultyDots.tsx
│   │   ├── PaywallCard.tsx
│   │   └── QueryView.tsx                     # loading/error/empty wrapper
│   ├── hooks/
│   │   └── useDebouncedValue.ts              # NEW
│   ├── lib/
│   │   ├── queryKeys.ts                      # NEW: единый источник query keys
│   │   └── database.types.ts                 # MODIFIED: regen после миграции
│   └── services/
│       └── storage.ts                        # NEW: getPublicUrl helper
├── supabase/
│   ├── migrations/
│   │   ├── 20260506000000_content.sql        # NEW: enums + tables + RLS + RPC
│   │   └── 20260506000001_search.sql         # NEW: tsvector + индексы + search RPC
│   └── seed.sql                              # NEW: контент для разработки
└── docs/
    └── progress.md                           # MODIFIED: Iter 2 → ✅ Done
```

## Клиентская архитектура

### React Query

Единый источник query keys в `src/lib/queryKeys.ts`:

```ts
export const qk = {
  exercises: {
    list: (filter?: string) => ['exercises', 'list', filter ?? 'all'] as const,
    detail: (slug: string) => ['exercises', 'detail', slug] as const,
    videoUrl: (slug: string) => ['exercises', 'video-url', slug] as const,
  },
  workouts: { list: (cat?: string) => [...], detail: (slug: string) => [...] },
  programs: { list: () => [...], detail: (slug: string) => [...] },
  blog:     { list: () => [...], detail: (slug: string) => [...] },
};
```

| Тип данных       | staleTime | gcTime |
| ---------------- | --------- | ------ |
| Списки контента  | 5 мин     | 30 мин |
| Детали           | 10 мин    | 30 мин |
| Blog list        | 2 мин     | 30 мин |
| Signed video URL | 50 мин    | 55 мин |
| Search           | 1 мин     | —      |

### Tier gate (клиент)

```ts
const TIER_ORDER = ['free', 'basic', 'pro', 'pro_max'] as const;
export type Tier = (typeof TIER_ORDER)[number];
export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}
```

UX: при `!hasAccess` — `TierBadge` на карточке + `PaywallCard` вместо видео. Сервер
независимо проверяет tier в RPC — клиентский gate чисто для UX.

### Глобальный state

Новых сторов **не добавляем**. Профиль (включая `subscription_tier`) уже доступен через
существующий `useAuthStore` / `useProfile` из Iter 1. Локальное состояние экранов —
`useState` или search params Expo Router.

## Экраны (детально)

| Экран              | Что показывает                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `home`             | Hero-приветствие + 3 секции (рекомендуемые тренировки, программы, посты блога)            |
| `workouts/index`   | `Segmented`: All/Upper/Lower/Full Body/Cardio/Core. Список `WorkoutCard`. Pull-to-refresh |
| `workouts/[slug]`  | Cover + meta + description + список `ExerciseRow` (sets × reps, rest, → к упражнению)     |
| `programs/index`   | Список `ProgramCard` (cover, weeks × sessions/wk, difficulty, tier badge)                 |
| `programs/[slug]`  | Hero + description + сетка «Неделя N / День 1-7 → Workout» (tap → `workouts/[slug]`)      |
| `exercises/[slug]` | GIF (всем) + description + chips (muscles, equipment) + видео или `PaywallCard` по tier   |
| `blog/index`       | Лента `BlogPostCard` (cover, title, excerpt, date)                                        |
| `blog/[slug]`      | Cover + title + author + date + markdown body                                             |
| `search/index`     | `Input` + chips (`All/Exercises/Workouts`) + список `SearchResultRow`                     |
| `profile`          | Iter 1 + секция «Подписка» (бейдж тарифа, read-only)                                      |

Loading/error/empty — через `<QueryView>` wrapper.

## Тестирование

Стек тот же (Jest + RNTL). Без E2E.

| Слой                | Что покрываем                        | Тестов  |
| ------------------- | ------------------------------------ | ------- |
| `tierGate`          | hasAccess для всех комбинаций        | ~7      |
| `features/*/api`    | success + error + фильтры            | ~30     |
| `features/*/hooks`  | loading→success, error, enabled-флаг | ~20     |
| `components/shared` | render + tier badge + paywall        | ~18     |
| Экраны (smoke)      | загрузка, пустое, paywall, тап       | ~20     |
| **Итого новых**     |                                      | **~95** |

Существующий supabase mock расширяем под query builder + `rpc` + `storage`.

### Ручные проверки

- Применить миграции, убедиться что `npm test` зелёный.
- Залить seed контент.
- RLS: non-admin юзер пытается `insert` через клиент → permission denied.
- RPC `get_exercise_video_url`: free-юзер на pro-упражнении → exception.
- RPC `search_content`: русский запрос («приседания»), английский («squat»).
- Storage: загрузка в private bucket → попытка прочитать через client без signed URL → отказ.
- Видео: открыть на iOS-симуляторе и Android-эмуляторе.

## Definition of Done

**Серверно:**

- [ ] `20260506000000_content.sql` + `20260506000001_search.sql` применены
- [ ] `database.types.ts` перегенерирован
- [ ] Storage buckets созданы (`exercise-media` private + 3 public), policies применены
- [ ] Seed залит: ≥10 упражнений, ≥5 тренировок, ≥2 программы, ≥3 поста
- [ ] RLS вручную проверены
- [ ] RPC `get_exercise_video_url` и `search_content` работают

**Клиент:**

- [ ] Все экраны собираются и открываются на iOS/Android
- [ ] Списки и детали рендерят реальные данные
- [ ] Tier gate: free-юзер видит paywall на pro-контенте, pro-юзер — видео
- [ ] Поиск возвращает результаты ≥2 символов

**Качество:**

- [ ] `npm typecheck` зелёный
- [ ] `npm lint` зелёный
- [ ] `npm test` зелёный (~155 тестов)
- [ ] `docs/progress.md` обновлён

## Что НЕ входит в Iter 2

- **Express backend** — Iter 3-4 (для RevenueCat webhooks, push fan-out)
- **RevenueCat / IAP** — Iter 3
- **Push-уведомления** — Iter 4
- **Офлайн-кеш видео** (`expo-file-system`) — Iter 4
- **Прогресс прохождения программы** (`user_workouts`, отметка «сделано»)
- **Избранное / saved**
- **Admin SPA** — Iter 6 (контент льём через seed + Studio)
- **Apple Health / Google Fit / Garmin**
- **Питание (Pro Max)** — Iter 5
- **FTS по программам и блогу** — добавим если понадобится
- **Поиск: история, голос, fuzzy за пределами FTS**
- **Комментарии / реакции на посты блога**
- **Деплинки в посты, шеринг**
