# Итерация 5 — Pro Max: питание (план реализации)

## Context

В roadmap (`docs/progress.md`) Итерация 5 — «Pro Max: питание». Это закрывает обещание Pro Max-тарифа из CLAUDE.md (Pro + nutrition tracking) и единственное, что отделяет Pro Max от Pro в продуктовом плане. Решено выйти на Iter 5, не дожидаясь завершения Iter 4 (push остаётся в проде, офлайн-часть Iter 4 уже сделана 2026-05-09).

**Итог итерации:** в приложении появляется дневник питания с подсчётом КБЖУ, доступный только для Pro Max. Остальные тарифы видят teaser на Home + paywall при попытке открыть дневник.

## Решения, зафиксированные в брейнсторме

| Тема                          | Решение                                                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Объём                         | Минимальный MVP: дневник, seed-база ~80 продуктов, цели КБЖУ, дневная сводка. **Без** штрих-кодов, рецептов, шаблонов приёмов, custom-продуктов от пользователя                                                                                  |
| База продуктов                | Свой `seed.sql` (~80 типичных продуктов RU). LIKE-фильтр по `lower(name)`, **без FTS** (минимальный объём)                                                                                                                                       |
| Цели КБЖУ                     | Mifflin-St Jeor BMR × activity factor × goal modifier. Поля в `profiles`: `sex`, `birth_date`, `height_cm`, `weight_kg`, `activity_level`, `weight_goal`. Manual override через `kcal_target`/`protein_g_target`/`fat_g_target`/`carbs_g_target` |
| Tier-gate                     | Только Pro Max. Сервер: RLS + проверка в RPC. Клиент: `hasAccess(tier, 'pro_max')` → paywall card                                                                                                                                                |
| Навигация                     | **Без** новой вкладки. Stack `app/(tabs)/nutrition/` с `href: null` (паттерн `exercises` из Iter 2). Точки входа: блок дневной сводки в Home (для Pro Max) + секция в Profile (для всех)                                                         |
| Снапшот нутриентов в дневнике | Не делаем. `food_id → public.foods` с `on delete restrict` — admin не сможет случайно удалить продукт, на который ссылается дневник                                                                                                              |
| RPC                           | Без RPC для сводки — суммируем на клиенте. RPC только при необходимости (если появится агрегация по неделям/месяцам)                                                                                                                             |

## Структура файлов

```
mobile-app/
├── app/
│   ├── (tabs)/
│   │   ├── nutrition/                        # NEW: stack без таба (href: null)
│   │   │   ├── _layout.tsx                   # NEW: Stack
│   │   │   ├── index.tsx                     # NEW: дневник на дату (Сводка + 4 секции)
│   │   │   ├── add.tsx                       # NEW: модалка добавления (?meal=breakfast)
│   │   │   └── targets.tsx                   # NEW: цели КБЖУ + физ. параметры
│   │   ├── _layout.tsx                       # MODIFIED: + Tabs.Screen name="nutrition" {href: null}
│   │   ├── home.tsx                          # MODIFIED: + блок дневной сводки питания (Pro Max)
│   │   └── profile.tsx                       # MODIFIED: + секция «Питание» (для всех, gated)
├── src/
│   ├── features/
│   │   └── nutrition/                        # NEW
│   │       ├── api/
│   │       │   ├── listFoods.ts              # SELECT public.foods + LIKE-фильтр
│   │       │   ├── listFoods.test.ts
│   │       │   ├── listEntriesForDate.ts     # SELECT nutrition_entries + JOIN foods за день
│   │       │   ├── listEntriesForDate.test.ts
│   │       │   ├── createEntry.ts            # INSERT
│   │       │   ├── createEntry.test.ts
│   │       │   ├── updateEntry.ts            # UPDATE quantity/meal_type
│   │       │   ├── deleteEntry.ts            # DELETE
│   │       │   └── index.ts
│   │       ├── hooks/
│   │       │   ├── useFoods.ts               # React Query (debounced search)
│   │       │   ├── useDailyEntries.ts        # entries + foods за день
│   │       │   ├── useDailySummary.ts        # суммирование KBJU + сравнение с целями
│   │       │   ├── useNutritionTargets.ts    # вычисление целей из профиля
│   │       │   ├── useCreateEntry.ts         # useMutation + invalidate
│   │       │   ├── useUpdateEntry.ts
│   │       │   ├── useDeleteEntry.ts
│   │       │   └── index.ts
│   │       ├── lib/
│   │       │   ├── computeTargets.ts         # Mifflin-St Jeor + activity + goal
│   │       │   ├── computeTargets.test.ts
│   │       │   ├── nutritionMath.ts          # scaleNutrients(per100g, grams)
│   │       │   ├── nutritionMath.test.ts
│   │       │   └── mealLabels.ts             # ru-метки для meal_type_enum
│   │       └── types.ts
│   ├── components/shared/
│   │   ├── MacroProgressBar.tsx              # прогресс-бар KBJU (consumed / target)
│   │   ├── MacroProgressBar.test.tsx
│   │   ├── DailyNutritionSummary.tsx         # glass-карточка с 4 progress bars
│   │   ├── DailyNutritionSummary.test.tsx
│   │   ├── MealSection.tsx                   # секция «Завтрак»/.../«Перекус» с FAB +
│   │   ├── FoodEntryRow.tsx                  # строка дневника: продукт + граммы + KBJU
│   │   ├── FoodEntryRow.test.tsx
│   │   ├── FoodPickerSheet.tsx               # выбор продукта: input + список
│   │   ├── QuantityStepper.tsx               # ввод грамм (input + ±10/±50)
│   │   ├── NutritionTeaserCard.tsx           # для Home/Profile, paywall для не-Pro Max
│   │   └── index.ts                          # MODIFIED: + новые экспорты
│   └── lib/
│       ├── queryKeys.ts                      # MODIFIED: + nutrition.{foods, entries, targets}
│       └── database.types.ts                 # MODIFIED: regen после миграции
├── supabase/
│   ├── migrations/
│   │   └── 20260510000000_nutrition.sql      # NEW
│   └── seed.sql                              # MODIFIED: + INSERT INTO public.foods (~80 строк)
└── docs/
    └── progress.md                           # MODIFIED: Iter 5 → ✅ Done
```

## DB миграция

Файл: `supabase/migrations/20260510000000_nutrition.sql`.

```sql
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

-- ВАЖНО: profiles_update_own (Iter 2) уже не даёт менять is_admin / subscription_tier.
-- Новые колонки в эту проверку не попадают — пользователь МОЖЕТ их обновлять. Это ожидаемо.

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
create policy "foods_read"  on public.foods for select using (auth.role() = 'authenticated');
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

-- Pro Max gate на серверной стороне: писать может только pro_max
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
```

После применения — регенерировать `src/lib/database.types.ts` через `mcp__supabase__generate_typescript_types`.

## Seed контент

Дополнить `supabase/seed.sql`:

```sql
insert into public.foods (slug, name, brand, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g) values
  ('chicken-breast', 'Куриная грудка (отварная)', null, 165, 31, 3.6, 0),
  ('beef-lean', 'Говядина (постная)', null, 187, 27, 9, 0),
  ('salmon', 'Лосось', null, 208, 20, 13, 0),
  ('eggs', 'Яйцо куриное', null, 155, 13, 11, 1.1),
  ('cottage-cheese-5', 'Творог 5%', null, 121, 17.2, 5, 1.8),
  ('greek-yogurt', 'Греческий йогурт натуральный', null, 97, 9, 5, 4),
  ('rice-white', 'Рис белый (вареный)', null, 130, 2.7, 0.3, 28),
  ('buckwheat', 'Гречка (вареная)', null, 110, 4, 1, 21),
  ('oats', 'Овсянка (на воде)', null, 88, 3, 1.7, 15),
  ('pasta', 'Макароны из твёрдых сортов (вареные)', null, 158, 5.8, 0.9, 31),
  -- ... ~70 ещё (овощи, фрукты, орехи, молочные, рыба, выпечка, напитки, сладости)
  ('apple', 'Яблоко', null, 52, 0.3, 0.2, 14),
  ('banana', 'Банан', null, 89, 1.1, 0.3, 23),
  -- и т. д.
;
```

Полный список (~80 продуктов) — категории: мясо/птица/рыба, яйца/молочка, крупы/хлеб, овощи, фрукты, орехи/масла, сладости/напитки. Точные значения — из открытых таблиц (USDA / Skurikhin).

## Клиентская архитектура

### `src/features/nutrition/lib/computeTargets.ts`

```ts
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Sex = Database['public']['Enums']['sex_enum'];
type Activity = Database['public']['Enums']['activity_level_enum'];
type Goal = Database['public']['Enums']['weight_goal_enum'];

export interface Targets {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

const ACTIVITY: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -0.15,
  maintain: 0,
  gain: 0.1,
};

export function computeBMR(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  // Mifflin–St Jeor
  return sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
}

export function computeTargets(
  profile: Pick<
    Profile,
    | 'sex'
    | 'birth_date'
    | 'height_cm'
    | 'weight_kg'
    | 'activity_level'
    | 'weight_goal'
    | 'kcal_target'
    | 'protein_g_target'
    | 'fat_g_target'
    | 'carbs_g_target'
  >,
  today: Date = new Date(),
): Targets | null {
  // Manual override (полный) имеет приоритет
  if (
    profile.kcal_target &&
    profile.protein_g_target != null &&
    profile.fat_g_target != null &&
    profile.carbs_g_target != null
  ) {
    return {
      kcal: profile.kcal_target,
      protein_g: profile.protein_g_target,
      fat_g: profile.fat_g_target,
      carbs_g: profile.carbs_g_target,
    };
  }

  if (
    !profile.sex ||
    !profile.birth_date ||
    !profile.height_cm ||
    !profile.weight_kg ||
    !profile.activity_level ||
    !profile.weight_goal
  ) {
    return null;
  }

  const age = Math.floor(
    (today.getTime() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 3600e3),
  );
  const bmr = computeBMR(profile.sex, Number(profile.weight_kg), profile.height_cm, age);
  const tdee = bmr * ACTIVITY[profile.activity_level];
  const kcal = Math.round(tdee * (1 + GOAL_DELTA[profile.weight_goal]));

  // Базовое распределение: P 1.8g/kg, F 1.0g/kg, C — остаток
  const protein_g = Math.round(Number(profile.weight_kg) * 1.8);
  const fat_g = Math.round(Number(profile.weight_kg) * 1.0);
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));
  return { kcal, protein_g, fat_g, carbs_g };
}
```

Тесты: 6 кейсов (M/F × lose/maintain/gain × manual override × неполный профиль → null).

### `src/features/nutrition/lib/nutritionMath.ts`

```ts
export interface Per100g {
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
}
export interface Macros {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export function scaleNutrients(food: Per100g, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: round1(food.kcal_per_100g * f),
    protein_g: round1(food.protein_per_100g * f),
    fat_g: round1(food.fat_per_100g * f),
    carbs_g: round1(food.carbs_per_100g * f),
  };
}
export function sumMacros(macros: Macros[]): Macros {
  /* ... */
}
const round1 = (v: number) => Math.round(v * 10) / 10;
```

### `src/lib/queryKeys.ts` — добавить ветку

```ts
nutrition: {
  all: ['nutrition'] as const,
  foods: (q?: string) => ['nutrition', 'foods', q ?? ''] as const,
  entries: (date: string) => ['nutrition', 'entries', date] as const,  // ISO YYYY-MM-DD
  targets: (uid: string) => ['nutrition', 'targets', uid] as const,
},
```

Mutations инвалидируют `qk.nutrition.entries(date)` и `qk.nutrition.all`.

### React Query stale/gc

| Тип                      | staleTime    | gcTime |
| ------------------------ | ------------ | ------ |
| Foods list (без фильтра) | 30 мин       | 60 мин |
| Foods search (q)         | 5 мин        | 30 мин |
| Daily entries            | 1 мин        | 30 мин |
| Targets (derived)        | — (computed) | —      |

`networkMode: 'offlineFirst'` для queries уже глобально (Iter 4); `mutations: 'online'`. Mutations требуют сети — это ОК для дневника, не пытаемся делать офлайн-write в этой итерации.

## Экраны

### `app/(tabs)/nutrition/_layout.tsx`

Stack без header (детали как в `(tabs)/exercises/_layout.tsx`).

### `app/(tabs)/nutrition/index.tsx` — главный экран дневника

Логика:

1. `useProfile()` → `useSubscriptionSummary()` → текущий tier.
2. Если `tier !== 'pro_max'` → рендер `<PaywallCard required="pro_max" />` на весь экран. Это **внутри** Pro Max-экрана; в Iter 4 переиспользуем существующий `<PaywallCard />`.
3. Иначе:
   - `useNutritionTargets()` — цели (если профиль не заполнен → CTA «Заполнить профиль» → `targets.tsx`).
   - `useDailyEntries(date)` — записи за выбранную дату (по умолчанию сегодня).
   - `useDailySummary(entries, targets)` — суммы.
   - Layout: header с date stepper (вчера/сегодня/завтра), `DailyNutritionSummary` сверху, 4 секции `MealSection` (Завтрак/Обед/Ужин/Перекус) с FAB «+» внутри секции (открывает `add.tsx?meal=…`).

### `app/(tabs)/nutrition/add.tsx` — добавление записи (modal-presentation)

Параметры route: `meal=breakfast|lunch|dinner|snack`, `date=YYYY-MM-DD`.

UI:

1. `<Input>` — поиск продукта (debounce 250ms → `useFoods(q)`).
2. Список `FoodPickerSheet` (вертикальный FlatList с `kcal/100g`).
3. После выбора — `<QuantityStepper>` (input + ±10/±50/±100) + live preview макросов.
4. Submit → `useCreateEntry()` → router.back().

### `app/(tabs)/nutrition/targets.tsx` — цели + физ. параметры

UI:

- Форма: пол, дата рождения, рост (см), вес (кг), активность (Segmented), цель (Segmented).
- Auto-вычисленные KBJU (preview).
- Toggle «Задать вручную» → 4 numeric input (kcal/protein/fat/carbs).
- Submit → `useUpdateProfile()` (существующий хук из Iter 1, расширить тип).

### Home — секция дневной сводки (Pro Max)

В `home.tsx` после welcome-блока (но до tier-карточек):

- Если `tier === 'pro_max'` и `targets` есть → `<DailyNutritionSummary compact />` с CTA «Открыть дневник» → `/(tabs)/nutrition`.
- Если `tier !== 'pro_max'` → ничего не показываем (на Home уже есть free-banner; не дублируем upsell).

### Profile — секция «Питание»

В `profile.tsx` после `SubscriptionSummaryCard`:

- Если `pro_max` → `<NutritionTeaserCard variant="open" />` (обзор: цели + ссылка «Дневник питания»).
- Иначе → `<NutritionTeaserCard variant="locked" />` (paywall preview).

## Tier-gate (детали)

| Слой           | Что блокирует                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| RLS            | `nutrition_entries` insert/update только если `has_pro_max_access()`                                                            |
| Клиент         | На входе в `nutrition/index.tsx` — `hasAccess(tier, 'pro_max')`; если false → `<PaywallCard required="pro_max">`                |
| Чтение foods   | Открыто всем authenticated (для preview справочника при upsell-кампаниях)                                                       |
| Чтение entries | По RLS: только свои записи. Free-юзер технически видит свои entries, но т.к. он не мог их создать (RLS на insert) — будет пусто |

## Тесты

Стек тот же (Jest + RNTL), без E2E.

| Слой                                              | Что покрываем                                                               | Тесты   |
| ------------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| `lib/computeTargets`                              | M/F × 3 цели, manual override (полный/частичный), incomplete profile → null | ~7      |
| `lib/nutritionMath`                               | scaleNutrients (round, 0g, дробные), sumMacros (пустой, обычный)            | ~5      |
| `api/listFoods`                                   | без q, с q (LIKE-фильтр), Supabase error                                    | ~3      |
| `api/listEntriesForDate`                          | пустой день, день с записями (с join), error                                | ~3      |
| `api/createEntry` / `updateEntry` / `deleteEntry` | success, RLS-ошибка                                                         | ~6      |
| `hooks/useDailyEntries`                           | loading→success, enabled-флаг (нет date)                                    | ~2      |
| `hooks/useNutritionTargets` / `useDailySummary`   | derived state, обновление при изменении entries                             | ~3      |
| `MacroProgressBar`                                | render, over-target colour state                                            | ~2      |
| `DailyNutritionSummary`                           | render, compact mode                                                        | ~2      |
| `FoodEntryRow`                                    | render + onDelete                                                           | ~2      |
| Smoke screens                                     | nutrition/index (paywall + pro_max), add, targets                           | ~5      |
| **Итого новых**                                   |                                                                             | **~40** |

Цель — `~221 тест` зелёных (181 → +40).

Расширения существующих моков:

- `database.types.ts` после regen — обновить mock в `__mocks__/supabase.ts`.
- Добавить mock для useProfile с `subscription_tier: 'pro_max'`.

### Ручные проверки

- Применить миграцию (`mcp__supabase__apply_migration` или Dashboard).
- Регенерировать `database.types.ts`.
- Залить seed (~80 продуктов через Studio SQL editor).
- На тестовом аккаунте установить `subscription_tier='pro_max'` через Studio → войти → проверить:
  - Дневник пустой → добавить запись «Куриная грудка 200г» в Завтрак → KBJU суммируется в сводке.
  - Свайп date stepper → данные за вчера/завтра подгружаются.
  - Заполнить targets через `targets.tsx` → KBJU цели проявляются в прогресс-барах.
  - Manual override: задать руками 2200/180/70/220 → видно ровно эти числа.
- На аккаунте `subscription_tier='free'` → `/(tabs)/nutrition` показывает paywall, попытка вызвать `nutrition_entries` insert через клиент → `permission denied` (проверить через console).
- Pro-юзер (не Pro Max): тоже paywall + RLS блокирует insert.

## Definition of Done

**Серверно:**

- [ ] Миграция `20260510000000_nutrition.sql` применена
- [ ] `database.types.ts` перегенерирован, новые enums и таблицы видны
- [ ] Seed залит (≥80 продуктов)
- [ ] RLS вручную проверены: free/basic/pro не могут писать в `nutrition_entries`, pro_max — может
- [ ] `has_pro_max_access()` работает

**Клиент:**

- [ ] `npm typecheck` зелёный
- [ ] `npm lint` зелёный
- [ ] `npm test` зелёный (~221 тест)
- [ ] Главный экран дневника собирается на iOS/Android
- [ ] Paywall на не-Pro Max — показывается и блокирует
- [ ] Pro Max: добавление/удаление записи, переключение даты, KBJU суммируется
- [ ] Home: блок дневной сводки показывается только Pro Max
- [ ] Profile: ссылка «Питание» открывает дневник для Pro Max, paywall — для остальных

**Документация:**

- [ ] `docs/progress.md` обновлён (Iter 5 → ✅ Done с датой)
- [ ] Спека `docs/superpowers/specs/2026-05-10-iteration-5-nutrition-design.md` создана
- [ ] План скопирован в `docs/superpowers/plans/2026-05-10-iteration-5-nutrition.md`

## Что НЕ входит в Iter 5

- Штрих-коды / camera scan
- Open Food Facts или другие внешние API
- Custom-продукты от пользователя
- Шаблоны приёмов / избранное
- Recipes / составные блюда
- Weight tracking history (только текущий вес в profile)
- Полнотекстовый поиск (FTS) по продуктам
- Экспорт дневника (CSV/PDF)
- Apple Health / Google Fit интеграция
- Push-напоминания «не забыл записать ужин» (после Iter 4)
- Виджеты / shortcuts
- Офлайн-write для mutations (queries уже офлайн-first из Iter 4)

## Реализационные шаги (краткий чек-лист для исполнителя)

1. Миграция + regen types + seed → `npm test` baseline.
2. `lib/computeTargets.ts` + `lib/nutritionMath.ts` + tests.
3. `api/*` модули + tests.
4. `hooks/*` (queries → mutations).
5. `queryKeys.ts` patch.
6. Shared компоненты в порядке зависимостей: `MacroProgressBar` → `DailyNutritionSummary` → `MealSection` → `FoodEntryRow` → `QuantityStepper` → `FoodPickerSheet` → `NutritionTeaserCard`.
7. Экраны: `nutrition/_layout`, `index`, `add`, `targets`.
8. Интеграция: `home.tsx` (блок сводки), `profile.tsx` (секция), `(tabs)/_layout.tsx` (Tabs.Screen `nutrition` `href: null`).
9. Smoke-тесты экранов.
10. `docs/progress.md` + спека + план в проектной папке.
11. `npm typecheck && npm lint && npm test` финально.
