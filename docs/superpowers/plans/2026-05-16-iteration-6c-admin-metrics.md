# Итерация 6c — Admin Metrics Dashboard + Audit Log

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить дашборд метрик (KPI-карточки + графики) и просмотр audit log в admin-SPA; закрыть отложенные задачи из 6b (code-split, очистка orphan storage при удалении).

**Architecture:** Метрики агрегируются через SECURITY DEFINER RPC-функции (паттерн из 6a/6b). UI — recharts-графики в новом feature `metrics/`. Audit log читается напрямую из `admin_audit_log` (RLS SELECT для admin уже есть). Тяжёлые роуты (exercises/workouts/programs/blog) переводятся на `React.lazy`. На жёсткое удаление blog_posts/programs добавляется cleanup storage-файлов.

**Tech Stack:** recharts, React.lazy + Suspense, Vitest + RTL, Supabase MCP (apply_migration + generate_typescript_types)

---

## Структура файлов

**Создаются:**

```
supabase/migrations/20260516000001_admin_metrics.sql

admin/src/features/metrics/
├── api/getMetrics.ts
├── api/getMetrics.test.ts
├── hooks/useMetrics.ts
├── hooks/useMetrics.test.ts
├── lib/mrrCalc.ts
├── lib/mrrCalc.test.ts
├── components/KpiCard.tsx
├── components/KpiCard.test.tsx
├── components/RegistrationsChart.tsx
├── components/SubscriptionEventsChart.tsx
├── components/TierPieChart.tsx
├── components/ContentStatsGrid.tsx
├── components/MetricsCharts.test.tsx   ← тесты для chart-компонентов
└── pages/MetricsPage.tsx
    pages/MetricsPage.test.tsx

admin/src/features/audit/
├── api/listAuditLog.ts
├── api/listAuditLog.test.ts
├── hooks/useAuditLog.ts
├── hooks/useAuditLog.test.ts
├── components/AuditTable.tsx
├── components/AuditDiffDialog.tsx
├── components/AuditLog.test.tsx         ← тесты компонентов
└── pages/AuditLogPage.tsx
    pages/AuditLogPage.test.tsx
```

**Изменяются:**

```
supabase/migrations/20260516000001_admin_metrics.sql  (создаётся)
src/lib/database.types.ts                             (регенерация через MCP)
admin/src/lib/queryKeys.ts                            (+metrics, +audit секции)
admin/src/router.tsx                                  (lazy + /metrics, /audit-log)
admin/src/components/shared/AppShell.tsx              (+2 пункта NAV)
admin/src/features/blog/api/deleteBlogPost.ts         (orphan cleanup)
admin/src/features/programs/api/deleteProgram.ts      (orphan cleanup)
admin/src/components/ui/FileUpload.tsx                (нет изменений — UX уже корректен)
```

---

## Task 1: DB Migration — Metrics RPC Functions

**Files:**

- Create: `supabase/migrations/20260516000001_admin_metrics.sql`
- Modify: `src/lib/database.types.ts` (регенерация)

- [ ] **Step 1: Создать файл миграции**

```sql
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
```

- [ ] **Step 2: Применить миграцию через Supabase MCP**

```
mcp__supabase__apply_migration с sql = <содержимое файла выше>
```

Ожидаемый результат: 5 функций созданы без ошибок.

- [ ] **Step 3: Регенерировать TypeScript-типы**

```
mcp__supabase__generate_typescript_types → скопировать в src/lib/database.types.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260516000001_admin_metrics.sql src/lib/database.types.ts
git commit -m "feat(db): iter 6c — metrics RPC functions"
```

---

## Task 2: Scaffold — recharts, queryKeys, router, AppShell

**Files:**

- Modify: `admin/package.json` (recharts)
- Modify: `admin/src/lib/queryKeys.ts`
- Modify: `admin/src/router.tsx`
- Modify: `admin/src/components/shared/AppShell.tsx`

- [ ] **Step 1: Установить recharts**

```bash
cd admin && npm install recharts
```

Recharts v2+ включает TypeScript-типы, `@types/recharts` не нужен.

- [ ] **Step 2: Добавить секции metrics + audit в queryKeys.ts**

В конец файла `admin/src/lib/queryKeys.ts` добавить перед `} as const;`:

```ts
  metrics: {
    registrations: (days: number) => ['metrics', 'registrations', days] as const,
    subscriptionEvents: (days: number) => ['metrics', 'subscriptionEvents', days] as const,
    tierDistribution: ['metrics', 'tierDistribution'] as const,
    activeSubs: ['metrics', 'activeSubs'] as const,
    contentStats: ['metrics', 'contentStats'] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (filters: AuditListFilters) => ['audit', 'list', filters] as const,
  },
```

В начало файла добавить интерфейс:

```ts
export interface AuditListFilters {
  action?: string;
  offset: number;
  limit: number;
}
```

- [ ] **Step 3: Обновить router.tsx — lazy routes + новые роуты**

Заменить `admin/src/router.tsx` целиком:

```tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { AppShell } from '@/components/shared/AppShell';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Лёгкие роуты — eager
// Тяжёлые — lazy (dnd-kit, markdown editor)
const FoodsListPage = lazy(() =>
  import('@/features/foods/pages/FoodsListPage').then((m) => ({ default: m.FoodsListPage })),
);
const BlogListPage = lazy(() =>
  import('@/features/blog/pages/BlogListPage').then((m) => ({ default: m.BlogListPage })),
);
const ExercisesListPage = lazy(() =>
  import('@/features/exercises/pages/ExercisesListPage').then((m) => ({
    default: m.ExercisesListPage,
  })),
);
const WorkoutsListPage = lazy(() =>
  import('@/features/workouts/pages/WorkoutsListPage').then((m) => ({
    default: m.WorkoutsListPage,
  })),
);
const ProgramsListPage = lazy(() =>
  import('@/features/programs/pages/ProgramsListPage').then((m) => ({
    default: m.ProgramsListPage,
  })),
);
const MetricsPage = lazy(() =>
  import('@/features/metrics/pages/MetricsPage').then((m) => ({ default: m.MetricsPage })),
);
const AuditLogPage = lazy(() =>
  import('@/features/audit/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
);

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/users" replace /> },
      { path: 'users', element: <UsersListPage /> },
      { path: 'users/:id', element: <UsersListPage /> },
      {
        path: 'exercises',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExercisesListPage />
          </Suspense>
        ),
      },
      {
        path: 'workouts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkoutsListPage />
          </Suspense>
        ),
      },
      {
        path: 'programs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProgramsListPage />
          </Suspense>
        ),
      },
      {
        path: 'blog',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BlogListPage />
          </Suspense>
        ),
      },
      {
        path: 'foods',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FoodsListPage />
          </Suspense>
        ),
      },
      {
        path: 'metrics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MetricsPage />
          </Suspense>
        ),
      },
      {
        path: 'audit-log',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AuditLogPage />
          </Suspense>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
```

- [ ] **Step 4: Добавить Метрики + Аудит в AppShell NAV**

В `admin/src/components/shared/AppShell.tsx` обновить массив NAV и импорты:

```ts
import {
  Activity,
  Apple,
  BarChart2,
  Calendar,
  ClipboardList,
  Dumbbell,
  FileText,
  Users,
} from 'lucide-react';

const NAV = [
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/exercises', label: 'Упражнения', icon: Dumbbell },
  { to: '/workouts', label: 'Тренировки', icon: Activity },
  { to: '/programs', label: 'Программы', icon: Calendar },
  { to: '/blog', label: 'Блог', icon: FileText },
  { to: '/foods', label: 'Продукты', icon: Apple },
  { to: '/metrics', label: 'Метрики', icon: BarChart2 },
  { to: '/audit-log', label: 'Аудит', icon: ClipboardList },
] as const;
```

- [ ] **Step 5: Проверить typecheck**

```bash
cd admin && npm run typecheck
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 6: Commit**

```bash
git add admin/
git commit -m "feat(admin): iter 6c scaffold — recharts, lazy routes, metrics+audit nav"
```

---

## Task 3: Metrics API + MRR calc + Hooks + Tests

**Files:**

- Create: `admin/src/features/metrics/api/getMetrics.ts`
- Create: `admin/src/features/metrics/api/getMetrics.test.ts`
- Create: `admin/src/features/metrics/lib/mrrCalc.ts`
- Create: `admin/src/features/metrics/lib/mrrCalc.test.ts`
- Create: `admin/src/features/metrics/hooks/useMetrics.ts`
- Create: `admin/src/features/metrics/hooks/useMetrics.test.ts`

- [ ] **Step 1: Написать тест для mrrCalc (TDD — сначала тест)**

```ts
// admin/src/features/metrics/lib/mrrCalc.test.ts
import { describe, expect, it } from 'vitest';
import { calcMrr, TIER_MONTHLY_PRICE_USD } from './mrrCalc';

describe('calcMrr', () => {
  it('возвращает 0 при пустом массиве', () => {
    expect(calcMrr([])).toBe(0);
  });

  it('суммирует активные тиры', () => {
    const result = calcMrr([
      { tier: 'basic', count: 10 },
      { tier: 'pro', count: 5 },
      { tier: 'pro_max', count: 2 },
    ]);
    const expected =
      10 * TIER_MONTHLY_PRICE_USD.basic +
      5 * TIER_MONTHLY_PRICE_USD.pro +
      2 * TIER_MONTHLY_PRICE_USD.pro_max;
    expect(result).toBeCloseTo(expected);
  });

  it('игнорирует неизвестный тир', () => {
    expect(calcMrr([{ tier: 'unknown', count: 100 }])).toBe(0);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

```bash
cd admin && npx vitest run src/features/metrics/lib/mrrCalc.test.ts
```

- [ ] **Step 3: Реализовать mrrCalc.ts**

```ts
// admin/src/features/metrics/lib/mrrCalc.ts
export const TIER_MONTHLY_PRICE_USD: Record<string, number> = {
  basic: 4.99,
  pro: 9.99,
  pro_max: 14.99,
};

export function calcMrr(activeSubs: { tier: string; count: number }[]): number {
  return activeSubs.reduce((sum, { tier, count }) => {
    return sum + (TIER_MONTHLY_PRICE_USD[tier] ?? 0) * count;
  }, 0);
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

```bash
cd admin && npx vitest run src/features/metrics/lib/mrrCalc.test.ts
```

- [ ] **Step 5: Написать тесты для API (TDD)**

```ts
// admin/src/features/metrics/api/getMetrics.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpcMock(...a) } }));

import {
  getRegistrationsDaily,
  getSubscriptionEventsDaily,
  getTierDistribution,
  getActiveSubs,
  getContentStats,
} from './getMetrics';

beforeEach(() => rpcMock.mockReset());

describe('getRegistrationsDaily', () => {
  it('вызывает нужный RPC и возвращает данные', async () => {
    const data = [{ day: '2026-05-01', new_users: 3 }];
    rpcMock.mockResolvedValueOnce({ data, error: null });
    const result = await getRegistrationsDaily(30);
    expect(rpcMock).toHaveBeenCalledWith('admin_get_registrations_daily', { p_days: 30 });
    expect(result).toEqual(data);
  });

  it('throw при ошибке', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('err') });
    await expect(getRegistrationsDaily(7)).rejects.toThrow('err');
  });
});

describe('getSubscriptionEventsDaily', () => {
  it('вызывает RPC с p_days', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await getSubscriptionEventsDaily(7);
    expect(rpcMock).toHaveBeenCalledWith('admin_get_subscription_events_daily', { p_days: 7 });
  });
});

describe('getTierDistribution', () => {
  it('вызывает RPC без аргументов', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await getTierDistribution();
    expect(rpcMock).toHaveBeenCalledWith('admin_get_tier_distribution');
  });
});

describe('getActiveSubs', () => {
  it('вызывает RPC без аргументов', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await getActiveSubs();
    expect(rpcMock).toHaveBeenCalledWith('admin_get_active_subs');
  });
});

describe('getContentStats', () => {
  it('возвращает первую строку результата', async () => {
    const row = {
      exercises_count: 10,
      workouts_count: 5,
      programs_count: 2,
      blog_posts_count: 3,
      foods_count: 74,
      total_users: 100,
    };
    rpcMock.mockResolvedValueOnce({ data: [row], error: null });
    const result = await getContentStats();
    expect(result).toEqual(row);
  });
});
```

- [ ] **Step 6: Запустить тесты — убедиться, что падают**

```bash
cd admin && npx vitest run src/features/metrics/api/getMetrics.test.ts
```

- [ ] **Step 7: Реализовать getMetrics.ts**

```ts
// admin/src/features/metrics/api/getMetrics.ts
import { supabase } from '@/lib/supabase';

export interface RegistrationDay {
  day: string;
  new_users: number;
}
export interface SubscriptionEventDay {
  day: string;
  event_type: string;
  count: number;
}
export interface TierCount {
  tier: string;
  count: number;
}
export interface ContentStats {
  exercises_count: number;
  workouts_count: number;
  programs_count: number;
  blog_posts_count: number;
  foods_count: number;
  total_users: number;
}

export async function getRegistrationsDaily(days: number): Promise<RegistrationDay[]> {
  const { data, error } = await supabase.rpc('admin_get_registrations_daily', { p_days: days });
  if (error) throw error;
  return (data ?? []) as RegistrationDay[];
}

export async function getSubscriptionEventsDaily(days: number): Promise<SubscriptionEventDay[]> {
  const { data, error } = await supabase.rpc('admin_get_subscription_events_daily', {
    p_days: days,
  });
  if (error) throw error;
  return (data ?? []) as SubscriptionEventDay[];
}

export async function getTierDistribution(): Promise<TierCount[]> {
  const { data, error } = await supabase.rpc('admin_get_tier_distribution');
  if (error) throw error;
  return (data ?? []) as TierCount[];
}

export async function getActiveSubs(): Promise<TierCount[]> {
  const { data, error } = await supabase.rpc('admin_get_active_subs');
  if (error) throw error;
  return (data ?? []) as TierCount[];
}

export async function getContentStats(): Promise<ContentStats> {
  const { data, error } = await supabase.rpc('admin_get_content_stats');
  if (error) throw error;
  const rows = (data ?? []) as ContentStats[];
  return rows[0]!;
}
```

- [ ] **Step 8: Запустить тесты API — убедиться, что проходят**

```bash
cd admin && npx vitest run src/features/metrics/api/getMetrics.test.ts
```

- [ ] **Step 9: Написать тест для hooks**

```ts
// admin/src/features/metrics/hooks/useMetrics.test.ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/utils';

vi.mock('../api/getMetrics', () => ({
  getRegistrationsDaily: vi.fn().mockResolvedValue([{ day: '2026-05-01', new_users: 1 }]),
  getSubscriptionEventsDaily: vi.fn().mockResolvedValue([]),
  getTierDistribution: vi.fn().mockResolvedValue([{ tier: 'free', count: 5 }]),
  getActiveSubs: vi.fn().mockResolvedValue([{ tier: 'basic', count: 2 }]),
  getContentStats: vi
    .fn()
    .mockResolvedValue({
      exercises_count: 10,
      workouts_count: 5,
      programs_count: 2,
      blog_posts_count: 3,
      foods_count: 74,
      total_users: 100,
    }),
}));

import {
  useRegistrationsDaily,
  useTierDistribution,
  useActiveSubs,
  useContentStats,
} from './useMetrics';

describe('useRegistrationsDaily', () => {
  it('возвращает данные после загрузки', async () => {
    const { result } = renderHook(() => useRegistrationsDaily(30), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ day: '2026-05-01', new_users: 1 }]);
  });
});

describe('useTierDistribution', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useTierDistribution(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.tier).toBe('free');
  });
});

describe('useActiveSubs', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useActiveSubs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useContentStats', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useContentStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_users).toBe(100);
  });
});
```

Примечание: `createWrapper()` — уже используется в существующих тестах (найти в `admin/src/test/` или `admin/src/lib/`).

- [ ] **Step 10: Реализовать useMetrics.ts**

```ts
// admin/src/features/metrics/hooks/useMetrics.ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import {
  getRegistrationsDaily,
  getSubscriptionEventsDaily,
  getTierDistribution,
  getActiveSubs,
  getContentStats,
} from '../api/getMetrics';

export const useRegistrationsDaily = (days: number) =>
  useQuery({
    queryKey: qk.metrics.registrations(days),
    queryFn: () => getRegistrationsDaily(days),
  });

export const useSubscriptionEventsDaily = (days: number) =>
  useQuery({
    queryKey: qk.metrics.subscriptionEvents(days),
    queryFn: () => getSubscriptionEventsDaily(days),
  });

export const useTierDistribution = () =>
  useQuery({ queryKey: qk.metrics.tierDistribution, queryFn: getTierDistribution });

export const useActiveSubs = () =>
  useQuery({ queryKey: qk.metrics.activeSubs, queryFn: getActiveSubs });

export const useContentStats = () =>
  useQuery({ queryKey: qk.metrics.contentStats, queryFn: getContentStats });
```

- [ ] **Step 11: Запустить все тесты метрик**

```bash
cd admin && npx vitest run src/features/metrics/
```

Ожидаемый результат: все тесты зелёные.

- [ ] **Step 12: Commit**

```bash
git add admin/src/features/metrics/
git commit -m "feat(admin): iter 6c — metrics API, MRR calc, hooks"
```

---

## Task 4: Metrics Dashboard UI

**Files:**

- Create: `admin/src/features/metrics/components/KpiCard.tsx`
- Create: `admin/src/features/metrics/components/RegistrationsChart.tsx`
- Create: `admin/src/features/metrics/components/SubscriptionEventsChart.tsx`
- Create: `admin/src/features/metrics/components/TierPieChart.tsx`
- Create: `admin/src/features/metrics/components/ContentStatsGrid.tsx`
- Create: `admin/src/features/metrics/components/MetricsCharts.test.tsx`
- Create: `admin/src/features/metrics/pages/MetricsPage.tsx`
- Create: `admin/src/features/metrics/pages/MetricsPage.test.tsx`

- [ ] **Step 1: Создать KpiCard.tsx**

```tsx
// admin/src/features/metrics/components/KpiCard.tsx
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-1 shadow-sm">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: Создать RegistrationsChart.tsx**

```tsx
// admin/src/features/metrics/components/RegistrationsChart.tsx
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RegistrationDay } from '../api/getMetrics';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  data: RegistrationDay[];
}

export function RegistrationsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    day: format(parseISO(d.day), 'd MMM', { locale: ru }),
    'Новые пользователи': d.new_users,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="Новые пользователи"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Создать SubscriptionEventsChart.tsx**

```tsx
// admin/src/features/metrics/components/SubscriptionEventsChart.tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SubscriptionEventDay } from '../api/getMetrics';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  data: SubscriptionEventDay[];
}

// Pivot: [{day, INITIAL_PURCHASE: n, CANCELLATION: m, ...}]
function pivot(data: SubscriptionEventDay[]) {
  const map = new Map<string, Record<string, number>>();
  for (const { day, event_type, count } of data) {
    if (!map.has(day)) map.set(day, { day });
    map.get(day)![event_type] = count;
  }
  return [...map.values()].map((row) => ({
    ...row,
    day: format(parseISO(row['day'] as string), 'd MMM', { locale: ru }),
  }));
}

const COLORS: Record<string, string> = {
  INITIAL_PURCHASE: '#16a34a',
  RENEWAL: '#2563EB',
  CANCELLATION: '#dc2626',
  EXPIRATION: '#f97316',
};

export function SubscriptionEventsChart({ data }: Props) {
  const pivoted = pivot(data);
  const types = [...new Set(data.map((d) => d.event_type))];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={pivoted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        {types.map((t) => (
          <Bar key={t} dataKey={t} stackId="a" fill={COLORS[t] ?? '#94a3b8'} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Создать TierPieChart.tsx**

```tsx
// admin/src/features/metrics/components/TierPieChart.tsx
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TierCount } from '../api/getMetrics';

const TIER_COLORS: Record<string, string> = {
  free: '#94a3b8',
  basic: '#60a5fa',
  pro: '#2563EB',
  pro_max: '#7c3aed',
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  pro_max: 'Pro Max',
};

interface Props {
  data: TierCount[];
}

export function TierPieChart({ data }: Props) {
  const formatted = data.map((d) => ({ ...d, name: TIER_LABELS[d.tier] ?? d.tier }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {formatted.map((d) => (
            <Cell key={d.tier} fill={TIER_COLORS[d.tier] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 5: Создать ContentStatsGrid.tsx**

```tsx
// admin/src/features/metrics/components/ContentStatsGrid.tsx
import type { ContentStats } from '../api/getMetrics';
import { KpiCard } from './KpiCard';

interface Props {
  data: ContentStats;
}

export function ContentStatsGrid({ data }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <KpiCard label="Упражнения" value={data.exercises_count} />
      <KpiCard label="Тренировки" value={data.workouts_count} />
      <KpiCard label="Программы" value={data.programs_count} />
      <KpiCard label="Посты блога" value={data.blog_posts_count} />
      <KpiCard label="Продукты" value={data.foods_count} />
      <KpiCard label="Пользователи" value={data.total_users} />
    </div>
  );
}
```

- [ ] **Step 6: Написать MetricsCharts.test.tsx**

```tsx
// admin/src/features/metrics/components/MetricsCharts.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from './KpiCard';
import { ContentStatsGrid } from './ContentStatsGrid';

describe('KpiCard', () => {
  it('отображает label и value', () => {
    render(<KpiCard label="MRR" value="$149.70" sub="est." />);
    expect(screen.getByText('MRR')).toBeDefined();
    expect(screen.getByText('$149.70')).toBeDefined();
    expect(screen.getByText('est.')).toBeDefined();
  });

  it('не рендерит sub если не передан', () => {
    const { queryByText } = render(<KpiCard label="X" value={42} />);
    expect(queryByText('est.')).toBeNull();
  });
});

describe('ContentStatsGrid', () => {
  it('отображает все 6 карточек', () => {
    const stats = {
      exercises_count: 10,
      workouts_count: 5,
      programs_count: 2,
      blog_posts_count: 3,
      foods_count: 74,
      total_users: 100,
    };
    render(<ContentStatsGrid data={stats} />);
    expect(screen.getByText('Упражнения')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Пользователи')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
  });
});
```

- [ ] **Step 7: Запустить тест компонентов**

```bash
cd admin && npx vitest run src/features/metrics/components/MetricsCharts.test.tsx
```

- [ ] **Step 8: Создать MetricsPage.tsx**

```tsx
// admin/src/features/metrics/pages/MetricsPage.tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCard } from '../components/KpiCard';
import { RegistrationsChart } from '../components/RegistrationsChart';
import { SubscriptionEventsChart } from '../components/SubscriptionEventsChart';
import { TierPieChart } from '../components/TierPieChart';
import { ContentStatsGrid } from '../components/ContentStatsGrid';
import {
  useRegistrationsDaily,
  useSubscriptionEventsDaily,
  useTierDistribution,
  useActiveSubs,
  useContentStats,
} from '../hooks/useMetrics';
import { calcMrr } from '../lib/mrrCalc';

const PERIOD_OPTIONS = [
  { label: '7 дней', value: 7 },
  { label: '30 дней', value: 30 },
  { label: '90 дней', value: 90 },
] as const;

export function MetricsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const registrations = useRegistrationsDaily(days);
  const subEvents = useSubscriptionEventsDaily(days);
  const tierDist = useTierDistribution();
  const activeSubs = useActiveSubs();
  const contentStats = useContentStats();

  const mrr = activeSubs.data ? calcMrr(activeSubs.data) : null;
  const arr = mrr != null ? mrr * 12 : null;

  const totalActive = activeSubs.data?.reduce((s, d) => s + d.count, 0) ?? 0;
  const totalUsers = contentStats.data?.total_users ?? 0;

  const newInPeriod = registrations.data?.reduce((s, d) => s + d.new_users, 0) ?? 0;

  const churned =
    subEvents.data
      ?.filter((e) => ['CANCELLATION', 'EXPIRATION'].includes(e.event_type))
      .reduce((s, e) => s + e.count, 0) ?? 0;

  const anyLoading =
    registrations.isLoading ||
    subEvents.isLoading ||
    tierDist.isLoading ||
    activeSubs.isLoading ||
    contentStats.isLoading;

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Метрики</h1>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={days === opt.value ? 'default' : 'outline'}
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {anyLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка…
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Активных подписок" value={totalActive} />
        <KpiCard label="Всего пользователей" value={totalUsers} />
        <KpiCard
          label="Est. MRR"
          value={mrr != null ? `$${mrr.toFixed(0)}` : '—'}
          sub={arr != null ? `ARR ≈ $${arr.toFixed(0)}` : undefined}
        />
        <KpiCard label={`Новых за ${days}д`} value={newInPeriod} sub={`Churn: ${churned}`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Новые пользователи</h2>
          {registrations.data ? <RegistrationsChart data={registrations.data} /> : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">События подписок</h2>
          {subEvents.data ? <SubscriptionEventsChart data={subEvents.data} /> : null}
        </section>
      </div>

      {/* Tier pie */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Распределение по тирам</h2>
        <div className="max-w-sm">
          {tierDist.data ? <TierPieChart data={tierDist.data} /> : null}
        </div>
      </section>

      {/* Content stats */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Контент</h2>
        {contentStats.data ? <ContentStatsGrid data={contentStats.data} /> : null}
      </section>
    </div>
  );
}
```

- [ ] **Step 9: Написать тест MetricsPage**

```tsx
// admin/src/features/metrics/pages/MetricsPage.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '@/test/utils';

vi.mock('../hooks/useMetrics', () => ({
  useRegistrationsDaily: () => ({ isLoading: false, data: [{ day: '2026-05-01', new_users: 3 }] }),
  useSubscriptionEventsDaily: () => ({ isLoading: false, data: [] }),
  useTierDistribution: () => ({ isLoading: false, data: [{ tier: 'free', count: 100 }] }),
  useActiveSubs: () => ({
    isLoading: false,
    data: [
      { tier: 'basic', count: 10 },
      { tier: 'pro', count: 5 },
    ],
  }),
  useContentStats: () => ({
    isLoading: false,
    data: {
      exercises_count: 42,
      workouts_count: 10,
      programs_count: 5,
      blog_posts_count: 8,
      foods_count: 74,
      total_users: 115,
    },
  }),
}));

// recharts нужен ResizeObserver в JSDOM
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

import { MetricsPage } from './MetricsPage';

describe('MetricsPage', () => {
  it('рендерит заголовок и KPI-карточки', () => {
    render(<MetricsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Метрики')).toBeDefined();
    expect(screen.getByText('Активных подписок')).toBeDefined();
    expect(screen.getByText('Всего пользователей')).toBeDefined();
  });

  it('показывает контент-статистику', () => {
    render(<MetricsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Упражнения')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });

  it('рендерит period-кнопки', () => {
    render(<MetricsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('7 дней')).toBeDefined();
    expect(screen.getByText('30 дней')).toBeDefined();
    expect(screen.getByText('90 дней')).toBeDefined();
  });
});
```

- [ ] **Step 10: Запустить тесты MetricsPage**

```bash
cd admin && npx vitest run src/features/metrics/pages/MetricsPage.test.tsx
```

- [ ] **Step 11: Commit**

```bash
git add admin/src/features/metrics/
git commit -m "feat(admin): iter 6c — metrics dashboard UI"
```

---

## Task 5: Audit Log Feature

**Files:**

- Create: `admin/src/features/audit/api/listAuditLog.ts`
- Create: `admin/src/features/audit/api/listAuditLog.test.ts`
- Create: `admin/src/features/audit/hooks/useAuditLog.ts`
- Create: `admin/src/features/audit/hooks/useAuditLog.test.ts`
- Create: `admin/src/features/audit/components/AuditTable.tsx`
- Create: `admin/src/features/audit/components/AuditDiffDialog.tsx`
- Create: `admin/src/features/audit/components/AuditLog.test.tsx`
- Create: `admin/src/features/audit/pages/AuditLogPage.tsx`
- Create: `admin/src/features/audit/pages/AuditLogPage.test.tsx`

- [ ] **Step 1: Написать тест для listAuditLog API**

```ts
// admin/src/features/audit/api/listAuditLog.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

const selectMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => fromMock(...a) } }));

import { listAuditLog } from './listAuditLog';

beforeEach(() => {
  fromMock.mockClear();
  selectMock.mockReset();
});

describe('listAuditLog', () => {
  it('запрашивает admin_audit_log с join профилей', async () => {
    selectMock.mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      }),
    });
    const result = await listAuditLog({ offset: 0, limit: 20 });
    expect(fromMock).toHaveBeenCalledWith('admin_audit_log');
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('фильтрует по action если передан', async () => {
    const ilikeMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      }),
    });
    selectMock.mockReturnValue({ ilike: ilikeMock });
    await listAuditLog({ offset: 0, limit: 20, action: 'subscription' });
    expect(ilikeMock).toHaveBeenCalledWith('action', '%subscription%');
  });

  it('throw при ошибке', async () => {
    selectMock.mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: null, count: null, error: new Error('err') }),
      }),
    });
    await expect(listAuditLog({ offset: 0, limit: 20 })).rejects.toThrow('err');
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

```bash
cd admin && npx vitest run src/features/audit/api/listAuditLog.test.ts
```

- [ ] **Step 3: Реализовать listAuditLog.ts**

```ts
// admin/src/features/audit/api/listAuditLog.ts
import { supabase } from '@/lib/supabase';
import type { AuditListFilters } from '@/lib/queryKeys';

export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  note: string | null;
  created_at: string;
  admin: { display_name: string | null; email: string | null } | null;
  target_user: { display_name: string | null; email: string | null } | null;
}

export interface ListAuditLogResult {
  rows: AuditLogRow[];
  total: number;
}

export async function listAuditLog(filters: AuditListFilters): Promise<ListAuditLogResult> {
  let query = supabase
    .from('admin_audit_log')
    .select(
      '*, admin:profiles!admin_id(display_name, email), target_user:profiles!target_user_id(display_name, email)',
      { count: 'exact' },
    );

  if (filters.action?.trim()) {
    query = (query as ReturnType<typeof supabase.from>).ilike(
      'action',
      `%${filters.action.trim()}%`,
    );
  }

  const { data, error, count } = await (query as ReturnType<typeof supabase.from>)
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (error) throw error;
  return { rows: (data ?? []) as AuditLogRow[], total: count ?? 0 };
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

```bash
cd admin && npx vitest run src/features/audit/api/listAuditLog.test.ts
```

- [ ] **Step 5: Создать useAuditLog.ts**

```ts
// admin/src/features/audit/hooks/useAuditLog.ts
import { useQuery } from '@tanstack/react-query';
import { qk, type AuditListFilters } from '@/lib/queryKeys';
import { listAuditLog } from '../api/listAuditLog';

export function useAuditLog(filters: AuditListFilters) {
  return useQuery({
    queryKey: qk.audit.list(filters),
    queryFn: () => listAuditLog(filters),
  });
}
```

- [ ] **Step 6: Написать тест для useAuditLog**

```ts
// admin/src/features/audit/hooks/useAuditLog.test.ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/utils';

vi.mock('../api/listAuditLog', () => ({
  listAuditLog: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
}));

import { useAuditLog } from './useAuditLog';

describe('useAuditLog', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useAuditLog({ offset: 0, limit: 20 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(0);
  });
});
```

- [ ] **Step 7: Создать AuditDiffDialog.tsx**

```tsx
// admin/src/features/audit/components/AuditDiffDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: string;
  before: unknown;
  after: unknown;
  note?: string | null;
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-xs text-muted-foreground italic">—</p>;
  }
  return (
    <pre className="text-xs bg-slate-50 rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function AuditDiffDialog({ open, onOpenChange, action, before, after, note }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Diff: {action}</DialogTitle>
        </DialogHeader>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">До</p>
            <JsonBlock value={before} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">После</p>
            <JsonBlock value={after} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 8: Создать AuditTable.tsx**

```tsx
// admin/src/features/audit/components/AuditTable.tsx
import { useState } from 'react';
import { formatDate } from '@/lib/formatDate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuditDiffDialog } from './AuditDiffDialog';
import type { AuditLogRow } from '../api/listAuditLog';

interface Props {
  rows: AuditLogRow[];
}

export function AuditTable({ rows }: Props) {
  const [diffRow, setDiffRow] = useState<AuditLogRow | null>(null);

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Дата</th>
            <th className="py-2 pr-4 font-medium">Действие</th>
            <th className="py-2 pr-4 font-medium">Сущность</th>
            <th className="py-2 pr-4 font-medium">Администратор</th>
            <th className="py-2 pr-4 font-medium">Пользователь</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-slate-50">
              <td className="py-2 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(row.created_at)}
              </td>
              <td className="py-2 pr-4">
                <Badge variant="outline" className="font-mono text-xs">
                  {row.action}
                </Badge>
              </td>
              <td className="py-2 pr-4 text-xs text-muted-foreground">
                {row.entity_type ? `${row.entity_type}` : '—'}
                {row.entity_id ? (
                  <span className="ml-1 font-mono opacity-60">{row.entity_id.slice(0, 8)}…</span>
                ) : null}
              </td>
              <td className="py-2 pr-4 text-xs">
                {row.admin?.display_name ?? row.admin?.email ?? '—'}
              </td>
              <td className="py-2 pr-4 text-xs">
                {row.target_user?.display_name ?? row.target_user?.email ?? '—'}
              </td>
              <td className="py-2">
                {(row.before !== null || row.after !== null) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setDiffRow(row)}
                  >
                    Diff
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                Записей нет
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {diffRow && (
        <AuditDiffDialog
          open
          onOpenChange={(v) => !v && setDiffRow(null)}
          action={diffRow.action}
          before={diffRow.before}
          after={diffRow.after}
          note={diffRow.note}
        />
      )}
    </>
  );
}
```

- [ ] **Step 9: Написать тесты для компонентов**

```tsx
// admin/src/features/audit/components/AuditLog.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuditTable } from './AuditTable';
import { AuditDiffDialog } from './AuditDiffDialog';
import type { AuditLogRow } from '../api/listAuditLog';

const row: AuditLogRow = {
  id: 'r1',
  action: 'food.create',
  entity_type: 'food',
  entity_id: '11111111-0000-0000-0000-000000000000',
  before: null,
  after: { name: 'Гречка' },
  note: null,
  created_at: '2026-05-16T10:00:00Z',
  admin: { display_name: 'Admin', email: 'admin@x.com' },
  target_user: null,
};

describe('AuditTable', () => {
  it('рендерит строку с action', () => {
    render(<AuditTable rows={[row]} />);
    expect(screen.getByText('food.create')).toBeDefined();
    expect(screen.getByText('Admin')).toBeDefined();
  });

  it('показывает "Записей нет" при пустом массиве', () => {
    render(<AuditTable rows={[]} />);
    expect(screen.getByText('Записей нет')).toBeDefined();
  });

  it('открывает diff dialog по клику на Diff', () => {
    render(<AuditTable rows={[row]} />);
    fireEvent.click(screen.getByText('Diff'));
    expect(screen.getByText('Diff: food.create')).toBeDefined();
  });
});

describe('AuditDiffDialog', () => {
  it('отображает before и after', () => {
    render(
      <AuditDiffDialog
        open
        onOpenChange={vi.fn()}
        action="workout.update"
        before={{ name: 'Old' }}
        after={{ name: 'New' }}
      />,
    );
    expect(screen.getByText(/Old/)).toBeDefined();
    expect(screen.getByText(/New/)).toBeDefined();
  });

  it('показывает note если передан', () => {
    render(
      <AuditDiffDialog
        open
        onOpenChange={vi.fn()}
        action="x"
        before={null}
        after={null}
        note="ручной override"
      />,
    );
    expect(screen.getByText('ручной override')).toBeDefined();
  });
});
```

- [ ] **Step 10: Запустить тесты компонентов**

```bash
cd admin && npx vitest run src/features/audit/components/AuditLog.test.tsx
```

- [ ] **Step 11: Создать AuditLogPage.tsx**

```tsx
// admin/src/features/audit/pages/AuditLogPage.tsx
import { useState } from 'react';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { AuditTable } from '../components/AuditTable';
import { useAuditLog } from '../hooks/useAuditLog';

const PAGE_SIZE = 30;

export function AuditLogPage() {
  const [action, setAction] = useState('');
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useAuditLog({
    action: action || undefined,
    offset,
    limit: PAGE_SIZE,
  });

  function handleSearch(v: string) {
    setAction(v);
    setOffset(0);
  }

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Аудит лог</h1>
        <DebouncedSearchInput
          value={action}
          onChange={handleSearch}
          placeholder="Фильтр по действию…"
          debounceMs={300}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <AuditTable rows={data?.rows ?? []} />
      )}

      <DataTablePagination
        total={data?.total ?? 0}
        offset={offset}
        limit={PAGE_SIZE}
        onOffsetChange={setOffset}
      />
    </div>
  );
}
```

- [ ] **Step 12: Написать тест AuditLogPage**

```tsx
// admin/src/features/audit/pages/AuditLogPage.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createWrapper } from '@/test/utils';

vi.mock('../hooks/useAuditLog', () => ({
  useAuditLog: () => ({ isLoading: false, data: { rows: [], total: 0 } }),
}));

import { AuditLogPage } from './AuditLogPage';

describe('AuditLogPage', () => {
  it('рендерит заголовок и пустую таблицу', () => {
    render(<AuditLogPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Аудит лог')).toBeDefined();
    expect(screen.getByText('Записей нет')).toBeDefined();
  });
});
```

- [ ] **Step 13: Запустить все тесты audit**

```bash
cd admin && npx vitest run src/features/audit/
```

- [ ] **Step 14: Commit**

```bash
git add admin/src/features/audit/
git commit -m "feat(admin): iter 6c — audit log feature (table + diff dialog)"
```

---

## Task 6: Orphan Storage Cleanup — Hard Delete

**Files:**

- Modify: `admin/src/features/blog/api/` — добавить удаление cover_path при hard delete
- Modify: `admin/src/features/programs/api/` — добавить удаление cover_path при hard delete

Сначала нужно найти существующие API-файлы: `find admin/src/features/blog/api/ admin/src/features/programs/api/ -name "*.ts"`

- [ ] **Step 1: Найти файлы delete-функций**

```bash
find admin/src/features/blog/api/ admin/src/features/programs/api/ -name "*.ts"
```

- [ ] **Step 2: Дополнить delete-функцию blog (hard delete)**

Открыть найденный файл `admin/src/features/blog/api/deleteBlogPost.ts` (или аналогичный).

Перед `supabase.from('blog_posts').delete()` добавить:

```ts
import { deleteFile } from '@/lib/storage';

// Читаем cover_path перед удалением
const { data: post } = await supabase.from('blog_posts').select('cover_path').eq('id', id).single();

// Удаляем запись
const { error } = await supabase.from('blog_posts').delete().eq('id', id);
if (error) throw error;

// Cleanup storage после успешного удаления
if (post?.cover_path) {
  await deleteFile('blog-media', post.cover_path).catch(() => undefined);
}
```

- [ ] **Step 3: Дополнить delete-функцию programs (hard delete)**

Аналогично для `admin/src/features/programs/api/deleteProgram.ts`:

```ts
import { deleteFile } from '@/lib/storage';

const { data: program } = await supabase
  .from('programs')
  .select('cover_path')
  .eq('id', id)
  .single();

const { error } = await supabase.from('programs').delete().eq('id', id);
if (error) throw error;

if (program?.cover_path) {
  await deleteFile('program-covers', program.cover_path).catch(() => undefined);
}
```

- [ ] **Step 4: Запустить typecheck**

```bash
cd admin && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/features/blog/ admin/src/features/programs/
git commit -m "fix(admin): cleanup storage files on hard delete of blog posts and programs"
```

---

## Task 7: Final Checks

- [ ] **Step 1: Запустить все тесты**

```bash
cd admin && npm test
```

Ожидаемый результат: все тесты зелёные (было 99, добавляются ~20–25 новых).

- [ ] **Step 2: Typecheck**

```bash
cd admin && npm run typecheck
```

- [ ] **Step 3: Lint**

```bash
cd admin && npm run lint
```

- [ ] **Step 4: Build**

```bash
cd admin && npm run build
```

Ожидаемый результат: 0 ошибок, bundle успешно собран.

- [ ] **Step 5: Обновить progress.md**

В `docs/progress.md`:

- Таблицу: Iter 6c → ✅ Done, дата 2026-05-16
- Итерацию 4 (Push) оставить In Progress
- Добавить секцию "Что реализовано (Итерация 6c)"

- [ ] **Step 6: Финальный commit**

```bash
git add docs/progress.md
git commit -m "docs(roadmap): mark Iter 6c as Done (2026-05-16)"
```

---

## Порядок выполнения

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
```

Все задачи линейны (зависят от предыдущих). Параллельное выполнение не применяется.

## Замечания

- `createWrapper()` — хелпер уже существует в проекте (`admin/src/test/utils.tsx` или аналог). Перед Step 9 Task 3 найти его путь командой `find admin/src -name "utils.tsx" -path "*/test/*"`.
- `date-fns/locale/ru` — `date-fns` уже в зависимостях, `ru`-локаль встроена.
- `recharts` совместим с React 18 и имеет встроенные TypeScript-типы.
- `DataTablePagination` уже есть в `admin/src/components/shared/`.
- `DebouncedSearchInput` уже есть в `admin/src/components/shared/`.
