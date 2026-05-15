# Итерация 6a — Admin SPA: каркас + Auth + Users + Subscription override

## Context

После Iter 0–5 управление контентом и подписками возможно только через Supabase Studio — это не масштабируется. Итерация 6 вводит отдельную **Admin SPA**, размещённую в том же монорепо в папке `admin/`. Объём Iter 6 большой (5 подсистем), поэтому разбиваем на четыре под-итерации.

**Под-итерация 6a (текущая)** — фундамент: каркас Vite+React, Supabase login, защита роутов по `is_admin`, список пользователей с фильтром по tier, ручной override подписки + аудит-лог. CRUD контента (6b), дашборд метрик (6c) и push (вне Iter 6) — не входят.

**Принцип безопасности:** service-role ключ в клиенте **не используем**. Все админские операции — через anon-key + RLS на `public.is_admin()` + SECURITY DEFINER RPC.

## Ключевые архитектурные решения

| Тема            | Решение                                                                                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Размещение      | `admin/` рядом с `src/` в том же git-repo. Без npm workspaces — отдельный `admin/package.json`, отдельный `node_modules`. Корневой `package.json` получает скрипты-обёртки `admin:*` через `npm --prefix admin run <task>`. |
| Билдер          | Vite 5 + React 18 + TypeScript 5.9.                                                                                                                                                                                         |
| TypeScript      | Отдельный `admin/tsconfig.json` (не extend корневого — корневой extend-ит `expo/tsconfig.base`). Алиас `@/*` → `admin/src/*`, `@shared/*` → `../src/*` (для переиспользования `database.types.ts`).                         |
| UI              | Tailwind CSS + shadcn/ui. Цвета из `src/theme/colors.ts` копируем значения в `tailwind.config.ts`.                                                                                                                          |
| Routing         | React Router v6 (`createBrowserRouter`).                                                                                                                                                                                    |
| Server state    | TanStack Query v5.                                                                                                                                                                                                          |
| Client state    | Zustand для auth-store (session, profile, isAdmin).                                                                                                                                                                         |
| Auth flow       | `supabase.auth.signInWithPassword` → проверка `profiles.is_admin` → если `false` → `signOut()` + ошибка. Persistence — `localStorage`.                                                                                      |
| Доступ к данным | anon-key + RLS. Override подписки — через RPC `admin_override_subscription` (SECURITY DEFINER).                                                                                                                             |
| Reuse           | `database.types.ts` импортируется через `@shared/lib/database.types`. Query keys, supabase-клиент — дублируются.                                                                                                            |
| Audit log       | Делаем в 6a — таблица `admin_audit_log` + запись внутри RPC. UI просмотра — в 6c.                                                                                                                                           |
| Тесты           | Vitest + React Testing Library + MSW. Ожидаемо ~37 тестов.                                                                                                                                                                  |

## DB миграция

Файл: `supabase/migrations/20260515000000_admin_access.sql`.

```sql
-- 1. Колонки на profiles
alter table public.profiles
  add column email text,
  add column subscription_override_note text;

-- Заполнить email для существующих
update public.profiles p set email = u.email
  from auth.users u where u.id = p.id;

-- Обновить handle_new_user так, чтобы копировал email при insert
-- (см. реализацию — расширяем существующий триггер)

-- 2. Audit log
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
create index admin_audit_log_target_idx on public.admin_audit_log (target_user_id, created_at desc);
create index admin_audit_log_admin_idx on public.admin_audit_log (admin_id, created_at desc);

alter table public.admin_audit_log enable row level security;
create policy "audit_admin_select" on public.admin_audit_log
  for select using (public.is_admin());
-- INSERT — только через SECURITY DEFINER функцию, политики нет

-- 3. Admin RLS на profiles (параллельные с existing profiles_select_own / profiles_update_own)
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 4. RPC: атомарный override
create or replace function public.admin_override_subscription(
  p_user_id uuid,
  p_tier subscription_tier_enum,
  p_status subscription_status_enum,
  p_expires_at timestamptz,
  p_will_renew boolean,
  p_note text
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  v_admin_id uuid := auth.uid();
  v_before jsonb;
  v_after public.profiles;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select to_jsonb(p.*) into v_before from public.profiles p where p.id = p_user_id;
  if v_before is null then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  update public.profiles set
    subscription_tier        = p_tier,
    subscription_status      = p_status,
    subscription_expires_at  = p_expires_at,
    subscription_will_renew  = coalesce(p_will_renew, false),
    subscription_override_note = p_note,
    subscription_updated_at  = now()
  where id = p_user_id returning * into v_after;
  insert into public.admin_audit_log (admin_id, action, target_user_id, before, after, note)
    values (v_admin_id, 'subscription_override', p_user_id, v_before, to_jsonb(v_after), p_note);
  return v_after;
end;
$$;
grant execute on function public.admin_override_subscription(
  uuid, subscription_tier_enum, subscription_status_enum, timestamptz, boolean, text
) to authenticated;
```

**После применения:**

- `mcp__supabase__generate_typescript_types` → обновить `src/lib/database.types.ts`
- В Studio: `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'test@mail.ru');`

**Почему добавили `profiles.email`:** anon-key не видит `auth.users`. Дублируем email в profiles через триггер — это проще, чем view поверх auth-схемы.

## Структура файлов

```
mobile-app/
├── package.json                            MODIFIED: + admin:* scripts
├── .gitignore                              MODIFIED: + admin/node_modules, admin/dist
├── admin/                                  NEW
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json + tsconfig.node.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── components.json                     (shadcn config)
│   ├── index.html
│   ├── .env.example                        (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   ├── .eslintrc.cjs
│   ├── README.md
│   ├── src/
│   │   ├── main.tsx, App.tsx, router.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts                 (localStorage-based client)
│   │   │   ├── queryClient.ts
│   │   │   ├── queryKeys.ts
│   │   │   ├── utils.ts                    (cn helper)
│   │   │   ├── formatDate.ts
│   │   │   └── hasAccess.ts
│   │   ├── components/
│   │   │   ├── ui/                         (shadcn: button, input, label, select,
│   │   │   │                                 dialog, sheet, table, badge, toast,
│   │   │   │                                 toaster, form, popover, calendar,
│   │   │   │                                 skeleton, separator)
│   │   │   └── shared/
│   │   │       ├── AppShell.tsx
│   │   │       ├── ProtectedRoute.tsx
│   │   │       ├── TierBadge.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── DataTablePagination.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── api/ (signInAdmin.ts + .test.ts, signOutAdmin.ts)
│   │   │   │   ├── hooks/ (useAdminSession.ts)
│   │   │   │   ├── store/ (auth.store.ts — Zustand)
│   │   │   │   └── pages/ (LoginPage.tsx + .test.tsx)
│   │   │   └── users/
│   │   │       ├── api/ (listUsers, getUserById, overrideSubscription + tests)
│   │   │       ├── hooks/ (useUsers, useUser, useOverrideSubscription)
│   │   │       ├── components/
│   │   │       │   ├── UsersTable.tsx + .test.tsx
│   │   │       │   ├── TierFilter.tsx
│   │   │       │   ├── UserSearchInput.tsx
│   │   │       │   ├── UserDetailDrawer.tsx
│   │   │       │   └── SubscriptionOverrideDialog.tsx + .test.tsx
│   │   │       └── pages/ (UsersListPage.tsx + .test.tsx)
│   │   ├── styles/globals.css              (Tailwind directives + shadcn CSS vars)
│   │   └── types/shared.ts                 (re-export Database, enums)
│   └── tests/
│       ├── setup.ts
│       ├── msw/ (server.ts, handlers.ts)
│       └── utils/ (renderWithProviders.tsx, mockProfile.ts)
└── supabase/migrations/20260515000000_admin_access.sql   NEW
```

## Корневой package.json — добавить скрипты

```jsonc
"admin:install":   "npm --prefix admin install",
"admin:dev":       "npm --prefix admin run dev",
"admin:build":     "npm --prefix admin run build",
"admin:preview":   "npm --prefix admin run preview",
"admin:lint":      "npm --prefix admin run lint",
"admin:typecheck": "npm --prefix admin run typecheck",
"admin:test":      "npm --prefix admin run test"
```

## Ключевые зависимости admin

- `@supabase/supabase-js ^2.105.3`, `@tanstack/react-query ^5.100.9`
- `react ^18.3`, `react-dom ^18.3`, `react-router-dom ^6`
- `@radix-ui/react-{dialog,label,popover,select,slot,toast}`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `lucide-react`
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `zustand ^5.0.13`, `date-fns ^3`
- dev: `vite ^5`, `vitest ^2`, `jsdom`, `msw ^2`, `@testing-library/{react,jest-dom,user-event}`, `tailwindcss ^3.4`, `eslint ^9`, `typescript ~5.9`

**Важно:** в admin React 18 (стабильная полоса shadcn/Radix); в RN остаётся React 19 — разные node_modules, конфликта нет.

## Auth-flow

### `signInAdmin(email, password)`

1. `supabase.auth.signInWithPassword`
2. `select id, is_admin, display_name from profiles where id = user.id`
3. Если ошибка selecta или `!is_admin` → `signOut()` + throw `FORBIDDEN_NOT_ADMIN`
4. Вернуть `{ session, profile }`

### `useAdminSession()` hook

- Mount: `getSession()` → если есть → дополучить profile.is_admin → если false, signOut + status `forbidden`
- Подписаться на `onAuthStateChange`, реагировать на SIGNED_OUT / TOKEN_REFRESHED / SIGNED_IN
- Возвращает `{ status: 'idle' | 'loading' | 'authenticated' | 'forbidden' | 'error', session, profile, isAdmin }`

### `<ProtectedRoute>`

- `status in ['idle', 'loading']` → spinner
- `status !== 'authenticated' || !isAdmin` → `<Navigate to="/login" replace />`
- Иначе — render children

## Роутинг

```ts
createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/users" replace /> },
      { path: 'users', element: <UsersListPage /> },
      { path: 'users/:id', element: <UsersListPage /> }, // drawer over same page
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
```

**Паттерн drawer-over-page:** `/users/:id` рендерит ту же `UsersListPage` + открывает `UserDetailDrawer` через Radix Sheet. URL диплинкуемый, состояние таблицы сохраняется.

## Экраны (scope 6a)

### `/login`

react-hook-form + zod (email valid, password ≥ 6). Submit → `signInAdmin`. Success → `navigate('/users')`. `FORBIDDEN_NOT_ADMIN` → toast "Этот аккаунт не админ". Остальные ошибки → toast `error.message`. Если уже залогинен — редирект на `/users`.

### `/users` — UsersListPage

Header `Пользователи` + filters (`TierFilter`, `UserSearchInput`) + `UsersTable`.

**Колонки:** email | display_name | tier (TierBadge) | status (StatusBadge) | expires_at (formatDate) | will_renew (✓/—) | created_at.

**Фильтры:** `TierFilter` — Radix Select (all/free/basic/pro/pro_max); `UserSearchInput` — debounce 300ms, `or(email.ilike.%q%, display_name.ilike.%q%)`. Pagination 50/страница, `range()` + `count: 'exact'`.

### Drawer `/users/:id` — UserDetailDrawer

Radix Sheet, side="right", 480px. Read-only блоки:

- Профиль: display_name, email, created_at, is_admin
- Подписка: tier, status, product_id, expires_at, will_renew, updated_at, revenuecat_app_user_id, override_note
- Nutrition: sex, age, height_cm, weight_kg, activity_level, weight_goal

CTA «Изменить подписку вручную» → `SubscriptionOverrideDialog`.

### SubscriptionOverrideDialog

rhf + zod:

- `tier`: Select free/basic/pro/pro_max — required
- `status`: Select из subscription_status_enum — required
- `expires_at`: Popover + Calendar — optional (null если tier=free)
- `will_renew`: checkbox — default false
- `note`: textarea — **required**, min 3 символа

Логика:

- `tier === 'free'` → expires_at=null, will_renew=false (форс)
- `status === 'active' && expires_at <= now` → предупреждение (не блок)

Submit → RPC → `invalidateQueries(qk.users.all)` + toast "Подписка обновлена".

## API-слой

### `listUsers({ tier?, search?, offset, limit })`

```ts
supabase
  .from('profiles')
  .select(
    'id, email, display_name, subscription_tier, subscription_status, subscription_expires_at, subscription_will_renew, is_admin, created_at',
    { count: 'exact' },
  )
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
// + .eq('subscription_tier', tier) если tier !== 'all'
// + .or(`email.ilike.%${s}%,display_name.ilike.%${s}%`) если search
```

Возвращает `{ rows, total }`.

### `overrideSubscription({ userId, tier, status, expiresAt, willRenew, note })`

```ts
supabase.rpc('admin_override_subscription', {
  p_user_id,
  p_tier,
  p_status,
  p_expires_at,
  p_will_renew,
  p_note,
});
```

## React Query настройки

| Query                 | staleTime | gcTime   |
| --------------------- | --------- | -------- |
| `qk.users.list(...)`  | 30s       | 5min     |
| `qk.users.detail(id)` | 30s       | 5min     |
| `qk.auth.session`     | Infinity  | Infinity |

`networkMode: 'always'` (веб). Mutations → `invalidateQueries({ queryKey: qk.users.all })`.

## Тесты (~37)

| Слой                         | Кейсы                                                                 | Кол-во |
| ---------------------------- | --------------------------------------------------------------------- | ------ |
| `lib/hasAccess`              | 5 tier-комбинаций                                                     | 5      |
| `api/signInAdmin`            | admin success, non-admin signOut, supabase error, profile fetch error | 4      |
| `api/listUsers`              | без фильтров, tier, search, pagination, error                         | 5      |
| `api/overrideSubscription`   | success, forbidden, user_not_found                                    | 3      |
| `hooks/useAdminSession`      | no session, admin session, non-admin (signOut), SIGNED_OUT event      | 4      |
| `hooks/useUsers`             | filter triggers refetch, key match                                    | 2      |
| `ProtectedRoute`             | redirect no-session, redirect non-admin, render admin                 | 3      |
| `UsersTable`                 | render, empty, loading skeleton                                       | 3      |
| `SubscriptionOverrideDialog` | zod validation, submit args, tier=free clears expires_at              | 3      |
| `LoginPage`                  | render, success navigate, forbidden toast                             | 3      |
| `UsersListPage`              | smoke + filter integration                                            | 2      |

MSW handlers стабят `/rest/v1/profiles*`, `/rest/v1/rpc/admin_override_subscription`, `/auth/v1/token`, `/auth/v1/user`.

## Ручные E2E проверки

1. Применить миграцию через `mcp__supabase__apply_migration`
2. Регенерировать `database.types.ts`
3. Studio: `is_admin=true` для `test@mail.ru`
4. `npm run admin:install && npm run admin:dev`
5. Открыть `http://localhost:5173` → редирект `/login`
6. Войти как `test@mail.ru` → попадание на `/users`, таблица видна
7. Войти не-админом → toast «Доступ запрещён»
8. Фильтр tier=pro → только pro-юзеры
9. Search по email → ровно нужный пользователь
10. Drawer → "Изменить подписку" → tier=pro_max, status=active, expires_at=+30d, note="Грант" → Submit
11. В Studio: `profiles.subscription_tier='pro_max'`, `subscription_override_note` заполнен, `admin_audit_log` пополнен записью с before/after
12. Залогиниться мобилкой тем же юзером → tier обновился
13. Negative: попытаться `select * from admin_audit_log` не-админом → permission denied
14. Negative: вызвать RPC override не-админом → `forbidden`

## Definition of Done

**Серверно:**

- [ ] Миграция применена
- [ ] `profiles.email`, `profiles.subscription_override_note`, `admin_audit_log` существуют
- [ ] `database.types.ts` перегенерирован
- [ ] RLS вручную проверены (не-админ заблокирован)
- [ ] `test@mail.ru` помечен `is_admin = true`

**Клиент (admin):**

- [ ] `npm run admin:install`, `admin:typecheck`, `admin:lint`, `admin:test` (~37), `admin:build` — всё зелёное
- [ ] `npm run admin:dev` запускается, login → users → override end-to-end
- [ ] `<ProtectedRoute>` редиректит неаутентифицированных и не-админов

**Документация:**

- [ ] `docs/progress.md` обновлён (Iter 6a → ✅ Done, дата)
- [ ] `admin/README.md` (setup инструкции)
- [ ] План перенесён в `docs/superpowers/plans/2026-05-15-iteration-6a-admin-skeleton.md`

## Что НЕ входит в 6a

- CRUD контента (exercises/workouts/programs/blog/foods) → **6b**
- Storage uploads (видео, gif, обложки) → **6b**
- Markdown-редактор для blog_posts → **6b**
- Dashboard метрики (DAU/MAU, MRR, churn) → **6c**
- UI просмотра `admin_audit_log` → **6c**
- Push UI + Edge Function → отложено за пределы Iter 6
- Bulk-actions, CSV-экспорт
- Управление ролями через UI (грант/ревок is_admin) — пока только SQL
- 2FA для админов
- Rate-limiting на login

## Реализационные шаги

1. Создать миграцию + apply + regen types + Studio `is_admin=true` для теста
2. Скаффолд `admin/` через `npm create vite@latest admin -- --template react-ts`, потом ручная очистка
3. Установить deps + Tailwind init + shadcn-cli init
4. `shadcn add` всех нужных примитивов
5. `lib/` (supabase, queryClient, queryKeys, utils, hasAccess)
6. `features/auth/` (store, api, hook, page) + тесты
7. `components/shared/` (AppShell, ProtectedRoute, TierBadge, StatusBadge)
8. `router.tsx` + `main.tsx` + `App.tsx`
9. `features/users/api/*` + тесты
10. `features/users/hooks/*`
11. `features/users/components/*` + тесты
12. `features/users/pages/UsersListPage.tsx` + smoke
13. MSW handlers + setup + renderWithProviders
14. Корневой `package.json` + `.gitignore`
15. Финал: `typecheck && lint && test && build`
16. Ручные E2E
17. `docs/progress.md` + план в `docs/superpowers/plans/`

## Критические файлы

- `supabase/migrations/20260515000000_admin_access.sql`
- `admin/src/lib/supabase.ts`
- `admin/src/features/auth/api/signInAdmin.ts`
- `admin/src/features/auth/hooks/useAdminSession.ts`
- `admin/src/components/shared/ProtectedRoute.tsx`
- `admin/src/features/users/api/listUsers.ts`
- `admin/src/features/users/api/overrideSubscription.ts`
- `admin/src/features/users/components/SubscriptionOverrideDialog.tsx`
- `admin/src/router.tsx`
