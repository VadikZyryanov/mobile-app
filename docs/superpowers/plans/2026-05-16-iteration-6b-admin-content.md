# Итерация 6b — Админ-SPA: CRUD контента

## Context

Iter 6a добавила каркас админ-SPA (`/admin/`) с аутентификацией, RLS-политиками для админа на `profiles` и единственной feature — управление пользователями. Дизайн-документация в `docs/progress.md` определяет следующий шаг (6b): полноценное управление всем контентом приложения из админки без захода в Supabase Studio.

Цель итерации — добавить CRUD для пяти сущностей (`exercises`, `workouts` + `workout_exercises`, `programs` + `program_workouts`, `blog_posts`, `foods`), загрузку медиа в Supabase Storage и markdown-редактор для блога. Это снимает блокер для контент-менеджмента и подготавливает почву для 6c (метрики + audit UI).

## Открытые вопросы — решения

| Вопрос                     | Решение                                                         | Обоснование                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хранение видео             | Supabase Storage (как сейчас)                                   | Mux/Cloudflare = отдельная инфраструктурная итерация. Мобилка уже использует `get_exercise_video_url` RPC.                                                                      |
| Markdown-редактор          | `@uiw/react-md-editor`                                          | Split-view, GFM, мобилка уже на `react-native-markdown-display` (тот же синтаксис). MDX не нужен (RN не рендерит JSX в markdown).                                               |
| Soft- vs hard-delete       | Soft для exercises/workouts/foods, hard для programs/blog_posts | FK `ON DELETE RESTRICT` на workout_exercises.exercise_id, program_workouts.workout_id, nutrition_entries.food_id сломает hard-delete. Programs/posts — нет ссылающейся истории. |
| Версионирование (snapshot) | Не делаем в 6b                                                  | `workout_sessions` ещё не существует. Soft-delete покрывает риск архивных данных.                                                                                               |
| Scope                      | Все 5 сущностей сразу                                           | Features изоморфны — общий паттерн. Параллелится между фазами.                                                                                                                  |

## Архитектура

### Общая структура каждой feature (повторяем паттерн из `features/users/`)

```
admin/src/features/<entity>/
├── api/                    # listX, getXById, createX/saveX, updateX, deleteX, restoreX (+ .test.ts)
├── hooks/                  # useX, useXs, useCreateX, useUpdateX, useDeleteX, useRestoreX
├── components/             # XTable, XFormDialog, XDetailDrawer, XFilters (+ .test.tsx)
└── pages/                  # XListPage.tsx
```

### Shared инфраструктура (новые файлы)

- `admin/src/lib/storage.ts` — обёртки `uploadFile`, `deleteFile`, `getPublicUrl`, `getSignedUrl`, `generateStoragePath`.
- `admin/src/lib/audit.ts` — `logAdminAction(action, entityType, entityId, before, after, note?)` → RPC.
- `admin/src/components/ui/FileUpload.tsx` — drag-n-drop + валидация type/size + превью.
- `admin/src/components/ui/MarkdownEditor.tsx` — обёртка над `@uiw/react-md-editor`.
- `admin/src/components/shared/ConfirmDialog.tsx` — общий confirm для destructive actions.
- `admin/src/components/shared/SoftDeleteToggle.tsx` — checkbox «Показать удалённые».
- `admin/src/components/shared/DebouncedSearchInput.tsx` — переиспользовать паттерн из [UserSearchInput.tsx](admin/src/features/users/components/UserSearchInput.tsx) как generic.
- `admin/src/types/content.ts` — типы Exercise/Workout/Program/BlogPost/Food + enum labels (русские).

### Архитектурные решения (зафиксированы)

1. **DB-операции для workouts/programs** — атомарные через SECURITY DEFINER RPC `admin_save_workout_with_exercises` / `admin_save_program_with_workouts` (parent + children в одной транзакции + audit запись).
2. **DB-операции для exercises/foods/blog_posts** — прямой REST через RLS (`is_admin()` уже разрешает) + отдельный вызов `admin_log_content_action`. Атомарность audit-записи приемлемая (риск рассинхрона на одиночных таблицах низкий).
3. **DnD-библиотека** — `@dnd-kit` (modern, accessible, React 18 strict mode совместим).
4. **Exercise/Workout picker** — Combobox на Radix Popover + список (no extra deps).
5. **Form-роутинг** — модалки (`*FormDialog`), а не отдельные страницы. Drawer для detail-view опционально (для foods/blog убираем — клик по строке открывает FormDialog в edit-mode).
6. **Audit log расширение** — добавить колонки `entity_type text` и `entity_id uuid` (nullable) в `admin_audit_log`, чтобы контент-actions не мимикрировали под user-actions через nullable `target_user_id`.

---

## План реализации (фазы)

### Фаза 1 — DB-миграция

**Файл:** `supabase/migrations/20260516000000_admin_content.sql` (новый)

Содержание:

1. **Soft-delete колонки:**

   ```sql
   alter table public.exercises add column deleted_at timestamptz;
   alter table public.workouts  add column deleted_at timestamptz;
   alter table public.foods     add column deleted_at timestamptz;

   create index exercises_active_idx on public.exercises (created_at desc) where deleted_at is null;
   create index workouts_active_idx  on public.workouts  (created_at desc) where deleted_at is null;
   create index foods_active_idx     on public.foods     (created_at desc) where deleted_at is null;
   ```

2. **Расширение `admin_audit_log`** (см. [20260515000000_admin_access.sql:33-42](supabase/migrations/20260515000000_admin_access.sql#L33-L42)):

   ```sql
   alter table public.admin_audit_log
     add column entity_type text,
     add column entity_id   uuid;
   create index admin_audit_log_entity_idx
     on public.admin_audit_log (entity_type, entity_id, created_at desc);
   ```

3. **Обновление RLS read-политик** (скрыть soft-deleted от non-admin):
   - `exercises_read` → `using (auth.role() = 'authenticated' and (deleted_at is null or public.is_admin()))`.
   - `workouts_read` → аналогично.
   - `foods_read` → аналогично.
   - `we_read`, `pw_read` — НЕ трогаем (фильтруются через `exists(workout)`/`exists(program)`, которые уже учтут soft-delete после обновления `workouts_read`).

4. **RPC `admin_save_workout_with_exercises(p_workout jsonb, p_exercises jsonb)`** — SECURITY DEFINER. Паттерн как [admin_override_subscription](supabase/migrations/20260515000000_admin_access.sql#L65-L110):
   - Guard `is_admin()`.
   - Upsert workout (insert если id null, update иначе).
   - `delete from workout_exercises where workout_id = v_id`.
   - Insert новых из `jsonb_array_elements(p_exercises)` с `position = ordinality`.
   - Audit: `action='workout.create' / 'workout.update'`, `entity_type='workout'`, `entity_id=v_id`, before/after jsonb.
   - Returns jsonb финального состояния (workout + exercises).

5. **RPC `admin_save_program_with_workouts(p_program jsonb, p_schedule jsonb)`** — тот же паттерн. Schedule = массив `{week, day_of_week, workout_id}`.

6. **RPC `admin_log_content_action(p_action text, p_entity_type text, p_entity_id uuid, p_before jsonb, p_after jsonb, p_note text)`** — универсальный logger. Guard is_admin, insert в `admin_audit_log` с `admin_id=auth.uid()`, `target_user_id=null`.

7. **Комментарий-документация в начале миграции** — перечень action-значений:
   ```
   -- Action values for admin_audit_log (entity_type / action):
   --   exercise.{create,update,delete,restore}
   --   workout.{create,update,delete,restore}
   --   program.{create,update,delete}
   --   blog_post.{create,update,delete}
   --   food.{create,update,delete,restore}
   ```

**После применения:** перегенерировать `src/lib/database.types.ts` через `mcp__supabase__generate_typescript_types`.

---

### Фаза 2 — Shared admin-инфраструктура

#### 2.1. Зависимости (в `admin/package.json`)

```
@uiw/react-md-editor
react-markdown
remark-gfm
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
```

Установка: `npm install --prefix admin <packages>` (в корне есть `admin:install` или эквивалент — проверить и при необходимости добавить).

#### 2.2. `admin/src/lib/storage.ts` (новый)

```ts
export type AdminBucket = 'exercise-media' | 'workout-covers' | 'program-covers' | 'blog-media';
export async function uploadFile(
  bucket: AdminBucket,
  file: File,
  path: string,
): Promise<{ path: string }>;
export async function deleteFile(bucket: AdminBucket, path: string): Promise<void>;
export function getPublicUrl(bucket: AdminBucket, path: string): string;
export async function getSignedUrl(
  bucket: AdminBucket,
  path: string,
  expiresIn?: number,
): Promise<string>;
export function generateStoragePath(prefix: string, filename: string): string; // `${prefix}/${Date.now()}-${slug(filename)}`
```

Прогресс-индикатор для крупных видео — без него в 6b (infinite spinner на UI), TODO для 6c.
Cleanup orphan-файлов — отложен на 6c (текущий старый path при замене НЕ удаляется).

Тест: `storage.test.ts` с моком `supabase.storage.from`.

#### 2.3. `admin/src/lib/audit.ts` (новый)

```ts
export type ContentEntity = 'exercise' | 'workout' | 'program' | 'blog_post' | 'food';
export type ContentAction = 'create' | 'update' | 'delete' | 'restore';

export async function logAdminAction(
  action: ContentAction,
  entity: ContentEntity,
  entityId: string,
  before: unknown,
  after: unknown,
  note?: string,
): Promise<void>;
```

Вызывает RPC `admin_log_content_action`. Тест мокает `supabase.rpc`.

#### 2.4. UI-компоненты

- **`admin/src/components/ui/FileUpload.tsx`** — drop-zone + native `<input type="file">`. Props: `bucket`, `pathPrefix`, `value: string | null`, `onChange`, `accept`, `maxSizeMB`, `kind: 'image' | 'video' | 'gif'`. Состояния idle/uploading/done. Превью через img/video. Тест: валидация + onChange.
- **`admin/src/components/ui/MarkdownEditor.tsx`** — обёртка `@uiw/react-md-editor` в split mode. Импорт CSS в `admin/src/main.tsx`. Props: `value`, `onChange`, `height?: number`.

#### 2.5. Shared-компоненты

- **`admin/src/components/shared/ConfirmDialog.tsx`** — Radix Dialog. Props: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `variant: 'destructive' | 'default'`, `onConfirm: () => Promise<void>`. Spinner на confirm-кнопке во время promise.
- **`admin/src/components/shared/SoftDeleteToggle.tsx`** — checkbox + label. Props: `value`, `onChange`.
- **`admin/src/components/shared/DebouncedSearchInput.tsx`** — generic version `UserSearchInput`. Props: `value`, `onChange`, `placeholder`, `debounceMs=300`.

#### 2.6. Обновления существующих файлов

**`admin/src/lib/queryKeys.ts`** ([текущий](admin/src/lib/queryKeys.ts)) — добавить:

```ts
export interface ExercisesListFilters { search?: string; primaryMuscle?: string; minTier?: string; includeDeleted?: boolean; offset: number; limit: number }
export interface WorkoutsListFilters { search?: string; category?: string; minTier?: string; includeDeleted?: boolean; offset: number; limit: number }
export interface ProgramsListFilters { search?: string; minTier?: string; difficulty?: number; offset: number; limit: number }
export interface BlogPostsListFilters { search?: string; status?: 'all' | 'published' | 'draft'; offset: number; limit: number }
export interface FoodsListFilters { search?: string; includeDeleted?: boolean; offset: number; limit: number }

qk = {
  ...,
  exercises:  { all, list(f), detail(id) },
  workouts:   { all, list(f), detail(id) },
  programs:   { all, list(f), detail(id) },
  blogPosts:  { all, list(f), detail(id) },
  foods:      { all, list(f), detail(id) },
}
```

**`admin/src/components/shared/AppShell.tsx:9`** — расширить NAV:

```ts
const NAV = [
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/exercises', label: 'Упражнения', icon: Dumbbell },
  { to: '/workouts', label: 'Тренировки', icon: Activity },
  { to: '/programs', label: 'Программы', icon: Calendar },
  { to: '/blog', label: 'Блог', icon: FileText },
  { to: '/foods', label: 'Продукты', icon: Apple },
] as const;
```

**`admin/src/router.tsx`** — добавить 5 пар роутов:

```ts
{ path: 'exercises', element: <ExercisesListPage /> },
{ path: 'exercises/:id', element: <ExercisesListPage /> },
// то же для workouts, programs, blog, foods
```

**`admin/src/types/content.ts`** (новый) — типы из `Database['public']['Tables'][...]['Row' | 'Insert' | 'Update']` + русские лейблы:

- `MUSCLE_GROUPS`, `MUSCLE_LABELS`
- `WORKOUT_CATEGORIES`, `WORKOUT_CATEGORY_LABELS`
- `TIER_OPTIONS` (free/basic/pro/pro_max)
- `DIFFICULTY_LABELS` (1=Лёгкая…5=Очень сложная)

---

### Фаза 3 — Feature `foods` (простейшая, отрабатываем паттерн)

**Файлы:** `admin/src/features/foods/{api,hooks,components,pages}/...`

API: `listFoods`, `getFoodById`, `createFood`, `updateFood`, `deleteFood` (soft), `restoreFood`. Все вызывают `logAdminAction` после успешного запроса.

Hooks: react-query wrappers, mutations с `invalidateQueries({ queryKey: qk.foods.all })`.

Components:

- `FoodsTable.tsx` — Slug, Name, Brand, КБЖУ (4 числа в одной cell), Deleted?. Клик по строке → открыть FormDialog в edit-mode.
- `FoodFormDialog.tsx` — поля: slug, name, brand?, kcal/protein/fat/carbs (number, step=0.1, min=0). Zod-валидация.

Page: `FoodsListPage.tsx` — header c кнопкой «Создать», `DebouncedSearchInput`, `SoftDeleteToggle`, table, `DataTablePagination`.

Drawer не делаем (foods — простая сущность).

---

### Фаза 4 — Feature `blog_posts`

API: `listBlogPosts` (с join `profiles` для author display_name), `getBlogPostById`, `createBlogPost` (author_id=auth uid), `updateBlogPost`, `deleteBlogPost` (HARD). Все логируются.

Hooks: стандартные.

Components:

- `BlogPostsTable.tsx` — Slug, Title, Status (Badge published/draft), Published at, Author.
- `BlogPostFormDialog.tsx` (max-w-5xl) — поля: slug, title, excerpt, body (`MarkdownEditor`), cover_path (FileUpload, bucket=blog-media, image, 5MB), published_at (`<input type="datetime-local">`, пустое = draft). Tabs Edit / Preview (Preview = `react-markdown` + `remark-gfm` со стилями prose, имитирующими мобилку).
- `BlogPostStatusFilter.tsx` — Select all/published/draft.

Page: `BlogPostsListPage.tsx`.

Drawer не делаем — клик по строке → FormDialog в edit-mode.

---

### Фаза 5 — Feature `exercises`

API: `listExercises` (фильтры primary_muscle, min_tier, search ilike по name, includeDeleted), `getExerciseById`, `createExercise`, `updateExercise`, `deleteExercise` (soft), `restoreExercise`. Все логируются.

Hooks: стандартные.

Components:

- `ExercisesTable.tsx` — Slug, Name, Primary muscle, Min tier, Deleted? (opacity-50 для soft-deleted).
- `ExerciseFormDialog.tsx` (max-w-3xl) — поля:
  - slug (unique, серверная валидация через error mapping)
  - name, description (textarea)
  - primary_muscle (Select из MUSCLE_GROUPS)
  - secondary_muscles (multi-chip — клик по чипу add/remove)
  - equipment (chips input с Enter для add)
  - gif_path (`<FileUpload bucket="exercise-media" accept="image/gif" maxSizeMB={10} kind="gif">`)
  - video_path (`<FileUpload bucket="exercise-media" accept="video/mp4" maxSizeMB={50} kind="video">`)
  - min_tier (Select)
- `ExerciseDetailDrawer.tsx` — Sheet (right), read-only поля + превью GIF/видео через `getSignedUrl('exercise-media', path)` в useEffect. Кнопки Edit / Delete-Restore через `ConfirmDialog`.
- `MuscleFilter.tsx`, `TierFilter.tsx` (если ещё нет shared — переиспользовать из users).

Page: `ExercisesListPage.tsx` — header с «Создать», `DebouncedSearchInput`, `MuscleFilter`, `TierFilter`, `SoftDeleteToggle`, table, pagination, drawer через `useParams`.

---

### Фаза 6 — Feature `workouts` (+`workout_exercises`)

Самая сложная фаза.

API:

- `listWorkouts` — фильтры category, min_tier, search, includeDeleted.
- `getWorkoutDetailAdmin` — `.select('*, workout_exercises(workout_id, position, exercise_id, sets, reps, rest_seconds, notes, exercise:exercises(id, slug, name))')` отсортировано по position.
- `saveWorkout(workout, exercises)` — вызывает RPC `admin_save_workout_with_exercises`. Возвращает финальный jsonb.
- `deleteWorkout` (soft), `restoreWorkout`. Логируются.

Hooks: `useWorkouts`, `useWorkoutDetail`, `useSaveWorkout` (invalidate list + detail), `useDeleteWorkout`, `useRestoreWorkout`.

Components:

- `WorkoutsTable.tsx` — Slug, Title, Category, Duration, Difficulty, Min tier, Deleted?.
- `WorkoutFormDialog.tsx` (max-w-5xl, scrollable):
  - Поля workout: slug, title, description, category (Select), cover_path (`<FileUpload bucket="workout-covers">`), duration_minutes, difficulty (Select 1-5), min_tier.
  - Секция «Упражнения» → `<WorkoutExercisesBuilder>`.
  - Submit → `saveWorkout({workout, exercises})`.
- **`WorkoutExercisesBuilder.tsx`** (ключевой компонент):
  - `useFieldArray` из react-hook-form.
  - DnD: `@dnd-kit` SortableContext + verticalListSortingStrategy.
  - Каждая строка: drag handle, position label (авто), `<ExercisePicker>`, sets (number), reps (text), rest_seconds (number), notes (textarea optional), delete button.
  - Кнопка «Добавить упражнение».
- **`ExercisePicker.tsx`** — Radix Popover + Command. Внутри: search input (debounced 200ms) → `listExercises({search, limit: 20, includeDeleted: false})` → список. Клик по итему → onChange(exercise_id). Selected state — отображение name.
- `WorkoutDetailDrawer.tsx` — read-only: cover + поля + список exercises с inline values.
- `CategoryFilter.tsx`.

Page: `WorkoutsListPage.tsx`.

---

### Фаза 7 — Feature `programs` (+`program_workouts`)

API:

- `listPrograms` — фильтры search, difficulty, min_tier.
- `getProgramDetailAdmin` — `.select('*, program_workouts(week, day_of_week, workout_id, workout:workouts(id, slug, title))')`.
- `saveProgram(program, schedule)` — RPC `admin_save_program_with_workouts`.
- `deleteProgram` (HARD `.delete()`) — логируется.

Hooks: стандартные.

Components:

- `ProgramsTable.tsx` — Slug, Title, Weeks, Sessions/week, Difficulty, Min tier.
- `ProgramFormDialog.tsx`:
  - Поля program: slug, title, description, cover_path (`<FileUpload bucket="program-covers">`), weeks (1-52), sessions_per_week (1-7), difficulty (1-5), min_tier.
  - `<ProgramScheduleBuilder>`.
- **`ProgramScheduleBuilder.tsx`** — grid (weeks × 7 дней):
  - State `Record<string, string | null>` где key = `${week}-${day}`, value = workout_id.
  - В каждой ячейке: `<WorkoutPicker>` (аналог ExercisePicker, ищет по workouts).
  - При изменении weeks — расширить/сократить grid. При уменьшении с потерей данных — confirm dialog.
  - На submit — преобразовать map в массив `{week, day_of_week, workout_id}` (только заполненные).
- **`WorkoutPicker.tsx`** — аналог ExercisePicker, listFn=listWorkouts.
- `ProgramDetailDrawer.tsx`, `DifficultyFilter.tsx`.

Page: `ProgramsListPage.tsx`.

---

### Фаза 8 — Audit log (только запись)

UI просмотра audit log отложен в 6c. В 6b каждый CRUD пишет в `admin_audit_log` через:

- `admin_log_content_action` (для exercises/foods/blog_posts — вызывается из API-слоя).
- Встроенный insert в `admin_save_workout_with_exercises` / `admin_save_program_with_workouts`.

Проверка через тесты: для каждого CRUD api-теста добавить assertion, что `supabase.rpc('admin_log_content_action', ...)` вызван с правильными аргументами.

---

### Фаза 9 — Тесты

API-тесты (паттерн [listUsers.test.ts](admin/src/features/users/api/listUsers.test.ts)):

- Happy path с моком fluent builder.
- Error case.
- Edge: includeDeleted=false → `.is('deleted_at', null)`.
- Mutation tests проверяют вызов `logAdminAction`.

Component-тесты:

- `<EntityTable>` — рендер, loading, empty.
- `<EntityFormDialog>` — zod-валидация, happy submit с мок-мутацией.
- `<FileUpload>` — валидация type/size, onChange после upload (мок storage).
- `<MarkdownEditor>` — smoke.
- `<ExercisePicker>` / `<WorkoutPicker>` — поиск, выбор.
- `<WorkoutExercisesBuilder>` — add/remove row, reorder (программный, без реальных drag-событий).
- `<ConfirmDialog>` — confirm/cancel.

Lib-тесты: `storage.test.ts`, `audit.test.ts`.

Скрипты (из корневого package.json — алиасы для `cd admin && ...`):

- `npm run admin:typecheck`
- `npm run admin:lint`
- `npm run admin:test`
- `npm run admin:build`

---

### Фаза 10 — Definition of Done

- [ ] Миграция `20260516000000_admin_content.sql` применена.
- [ ] `src/lib/database.types.ts` перегенерирован.
- [ ] 6 пунктов в `AppShell.NAV` (Users + 5 новых).
- [ ] 5 listpages с фильтрами/поиском + SoftDeleteToggle где применимо.
- [ ] 5 form dialogs (create/edit) с rhf + zod валидацией.
- [ ] ConfirmDialog для destructive actions.
- [ ] Uploads работают (4 типа файлов, 4 buckets).
- [ ] MarkdownEditor + Preview tab для blog_posts.
- [ ] DnD в WorkoutExercisesBuilder.
- [ ] Grid в ProgramScheduleBuilder.
- [ ] Все CRUD пишут в admin_audit_log (через RPC).
- [ ] `admin:typecheck` ✅
- [ ] `admin:lint` ✅
- [ ] `admin:test` ✅
- [ ] `admin:build` ✅
- [ ] Manual QA: blog markdown рендерится в `app/(tabs)/blog/[slug].tsx`.
- [ ] Manual QA: создание exercise → видно в мобилке через `app/(tabs)/exercises`.
- [ ] `docs/progress.md` обновлён: статус 6b → ✅ Done + дата.

---

## Sequencing рекомендация

Фазы 1 и 2 — sequential (нужны до начала feature-фаз).
Фазы 3-7 — независимы после фазы 2, можно распараллелить между сабагентами.
Фаза 8 — проверка по факту (без отдельной работы).
Фаза 9 — параллельно с feature-фазами (тесты пишутся вместе с кодом, паттерн TDD).
Фаза 10 — финальная сверка.

Оптимальный одноагентный путь по нарастанию сложности:

1. Phase 1 (migration) → 2. Phase 2 (shared) → 3. Phase 3 (foods) → 4. Phase 4 (blog) → 5. Phase 5 (exercises) → 6. Phase 6 (workouts) → 7. Phase 7 (programs) → 8. Phase 10 (DoD).

---

## Critical files

**Создать:**

- [supabase/migrations/20260516000000_admin_content.sql](supabase/migrations/) — soft-delete + audit-log расширение + 3 RPC.
- [admin/src/lib/storage.ts](admin/src/lib/) — Supabase Storage abstraction.
- [admin/src/lib/audit.ts](admin/src/lib/) — audit log helper.
- [admin/src/components/ui/FileUpload.tsx](admin/src/components/ui/) — переиспользуется ×4.
- [admin/src/components/ui/MarkdownEditor.tsx](admin/src/components/ui/).
- [admin/src/components/shared/ConfirmDialog.tsx](admin/src/components/shared/), [SoftDeleteToggle.tsx](admin/src/components/shared/), [DebouncedSearchInput.tsx](admin/src/components/shared/).
- [admin/src/types/content.ts](admin/src/types/).
- 5 features × ~10-14 файлов каждая (foods/blog/exercises/workouts/programs).
- Ключевые UI: [WorkoutExercisesBuilder.tsx], [ExercisePicker.tsx], [ProgramScheduleBuilder.tsx], [WorkoutPicker.tsx].

**Изменить:**

- [admin/src/router.tsx](admin/src/router.tsx) — +10 роутов.
- [admin/src/components/shared/AppShell.tsx](admin/src/components/shared/AppShell.tsx) — NAV.
- [admin/src/lib/queryKeys.ts](admin/src/lib/queryKeys.ts) — 5 новых секций + filter типы.
- [admin/package.json](admin/package.json) — 6 новых deps.
- [admin/src/main.tsx](admin/src/main.tsx) — импорт CSS `@uiw/react-md-editor`.
- [src/lib/database.types.ts](src/lib/database.types.ts) — regenerate.
- [docs/progress.md](docs/progress.md) — статус 6b → ✅ Done.

**Reference patterns (не менять, использовать как шаблон):**

- [admin/src/features/users/api/listUsers.ts](admin/src/features/users/api/listUsers.ts) — list с фильтрами + pagination.
- [admin/src/features/users/api/listUsers.test.ts](admin/src/features/users/api/listUsers.test.ts) — API тест с моком supabase.
- [admin/src/features/users/components/SubscriptionOverrideDialog.tsx](admin/src/features/users/components/SubscriptionOverrideDialog.tsx) — rhf + zod form dialog.
- [admin/src/features/users/components/UsersTable.tsx](admin/src/features/users/components/UsersTable.tsx) — table с loading/empty.
- [admin/src/features/users/pages/UsersListPage.tsx](admin/src/features/users/pages/UsersListPage.tsx) — orchestrator.
- [supabase/migrations/20260515000000_admin_access.sql:65-110](supabase/migrations/20260515000000_admin_access.sql#L65-L110) — паттерн SECURITY DEFINER + audit.

---

## Verification

После завершения всех фаз:

1. **DB**: применить миграцию через `npx supabase db push` (или Supabase MCP `mcp__supabase__apply_migration`). Проверить через `mcp__supabase__list_tables` что новые колонки и RPC появились.
2. **Типы**: `mcp__supabase__generate_typescript_types` → обновить `src/lib/database.types.ts`.
3. **Сборка**: `npm run admin:typecheck && npm run admin:lint && npm run admin:test && npm run admin:build`.
4. **Manual QA через dev сервер**:
   - `npm run admin:dev` → залогиниться `test@mail.ru`.
   - Создать food → проверить в мобилке через nutrition add screen.
   - Создать exercise с GIF + видео → проверить в Supabase Studio Storage и в мобилке `app/(tabs)/exercises/[slug]`.
   - Создать workout с 3 exercises + drag-reorder → проверить порядок в мобилке.
   - Создать program с расписанием → проверить мобильный экран программы.
   - Создать blog post (published_at=now) → проверить markdown рендер в `app/(tabs)/blog/[slug]`.
   - Создать draft (published_at пусто) → проверить что не виден non-admin.
   - Soft-delete exercise → не виден non-admin, виден в админке с toggle.
   - Restore → виден всем.
5. **Audit log**: после серии операций — `select * from admin_audit_log order by created_at desc limit 20` (через MCP) — должны быть записи с `entity_type` и `entity_id`.
6. **Финал**: обновить `docs/progress.md` (статус 6b → ✅ Done, дата). Закоммитить миграцию + код + progress.md одним PR.

---

## Открытые вопросы (отложены)

- **Cleanup orphan storage-файлов** при замене path в форме → iter 6c.
- **Upload progress UI** для крупных видео → iter 6c (когда понадобится).
- **Audit log viewer UI** → iter 6c.
- **RLS join-edge case** (soft-deleted exercise в workout_exercises возвращает NULL через RLS) → TODO в progress.md, решение в iter 6c (фильтрация на клиенте мобилки или расширение RLS read для exercises).
- **Bulk actions + CSV export** → отдельная итерация (упомянуто в progress.md как "идеи без номера").

## Риски

| Риск                                                         | Митигация                                                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| RLS update сломает мобильное чтение                          | Тщательно проверить RLS политики локально через supabase CLI + смоук-тест на мобилке после миграции                                    |
| RPC `admin_save_*` не атомарен из-за ошибки в jsonb-парсинге | Unit-тесты на RPC через `supabase db query` (вручную или в CI)                                                                         |
| FileUpload upsert конфликт при одинаковых именах             | `generateStoragePath` с timestamp префиксом                                                                                            |
| Drag-and-drop ломается в RTL/тестах                          | `@dnd-kit` поддерживает keyboard-навигацию — тесты через keyboard, не mouse                                                            |
| Markdown в админке расходится с рендером мобилки             | Preview tab использует тот же markdown синтаксис; проверка только GFM-подмножества (без image/code-blocks которые мобилка не рендерит) |
| Большой PR (5 features) тяжело ревьюить                      | Коммитить пофазно: phase 1 → 2 → 3 → ... — 8-10 коммитов                                                                               |
