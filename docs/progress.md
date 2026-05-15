# Roadmap & Progress

| #   | Итерация              | Статус         | Дата завершения |
| --- | --------------------- | -------------- | --------------- |
| 0   | Фундамент             | ✅ Done        | 2026-05-05      |
| 1   | Auth + Supabase       | ✅ Done        | 2026-05-06      |
| 2   | Backend MVP + контент | ✅ Done        | 2026-05-07      |
| 3   | Подписки (RevenueCat) | ✅ Done        | 2026-05-09      |
| 4   | Push + офлайн         | 🔄 In Progress |                 |
| 5   | Pro Max: питание      | ✅ Done        | 2026-05-11      |
| 6   | Админ-SPA (6a)        | ✅ Done        | 2026-05-15      |

## Текущая итерация

Все итерации до 6a завершены. Следующая: **6b** (CRUD контента).

## Что реализовано (Итерация 6a)

- Каркас `admin/` — Vite 5 + React 18 + TypeScript 5.9 + Tailwind CSS 3.4 + shadcn/ui (ручные примитивы)
- `admin/tsconfig.json` с алиасами `@/*` → `admin/src/*`, `@shared/*` → `../src/*`
- `admin/src/lib/` — supabase (localStorage-based), queryClient, queryKeys, utils (cn), hasAccess, formatDate
- Auth flow: `signInAdmin` (signInWithPassword → проверка `is_admin` → signOut + throw если не-админ), `useAdminSession` hook, Zustand auth.store
- `<ProtectedRoute>` — редиректит не-аутентифицированных и не-админов на `/login`
- `<AppShell>` — боковая навигация (Пользователи), шапка с именем + logout
- React Router v6: `/login`, `/users`, `/users/:id` (drawer-over-page)
- `features/users/api/` — `listUsers` (фильтр tier + поиск ilike + pagination), `getUserById`, `overrideSubscription` (RPC `admin_override_subscription`)
- `features/users/hooks/` — `useUsers`, `useUser`, `useOverrideSubscription`
- `features/users/components/` — `UsersTable`, `TierFilter`, `UserSearchInput` (debounce 300ms), `UserDetailDrawer`, `SubscriptionOverrideDialog` (rhf + zod)
- `features/users/pages/UsersListPage.tsx`
- `features/auth/pages/LoginPage.tsx`
- Vitest + RTL + MSW v2: 26 тестов, все зелёные
- Корневой `package.json`: 7 `admin:*` скриптов; `.gitignore` + `tsconfig.json` + `jest.config.js` обновлены

**DB (применено через Supabase MCP, 2026-05-15):**

- `profiles.email` (mirror из auth.users, backfill + триггер)
- `profiles.subscription_override_note`
- `admin_audit_log` + RLS (SELECT для admin, INSERT только через RPC)
- `profiles_admin_select` + `profiles_admin_update` RLS политики
- RPC `admin_override_subscription` (SECURITY DEFINER, атомарный override + audit)
- `test@mail.ru` → `is_admin = true`
- `src/lib/database.types.ts` перегенерирован

**Финальные проверки (2026-05-15):**

- `admin:typecheck` ✅, `admin:lint` ✅, `admin:test` ✅ (26/26), `admin:build` ✅

## Что реализовано (Итерация 5)

- DB: миграция `20260510000000_nutrition.sql` — enums (`sex_enum`, `activity_level_enum`, `weight_goal_enum`, `meal_type_enum`), расширение `profiles` (10 новых колонок: физ. параметры + КБЖУ override), таблицы `foods` (admin-managed, RLS) и `nutrition_entries` (Pro Max gate через `has_pro_max_access()`)
- Seed: ~74 продукта в `supabase/seed.sql` (мясо, рыба, молочка, крупы, овощи, фрукты, орехи, выпечка, напитки)
- `database.types.ts` перегенерирован (новые таблицы и enums)
- `src/lib/queryKeys.ts` — ветка `nutrition.{foods, entries, targets}`
- `src/features/nutrition/lib/computeTargets.ts` — Mifflin-St Jeor + activity factor + goal delta + manual override
- `src/features/nutrition/lib/nutritionMath.ts` — `scaleNutrients`, `sumMacros`
- `src/features/nutrition/lib/mealLabels.ts` — русские метки `MEAL_LABELS`, порядок `MEAL_ORDER`
- `src/features/nutrition/api/*` — `listFoods` (ilike-поиск), `listEntriesForDate` (join с foods), `createEntry`, `updateEntry`, `deleteEntry`
- `src/features/nutrition/hooks/*` — `useFoods`, `useDailyEntries`, `useDailySummary`, `useNutritionTargets`, `useCreateEntry`, `useUpdateEntry`, `useDeleteEntry`
- Shared компоненты: `MacroProgressBar`, `DailyNutritionSummary`, `FoodEntryRow`, `MealSection`, `QuantityStepper`, `FoodPickerSheet`, `NutritionTeaserCard`
- Экраны: `app/(tabs)/nutrition/_layout`, `index` (дневник с date stepper + 4 секции приёмов), `add` (поиск + граммы + preview), `targets` (форма физ. параметров + auto/manual цели)
- Интеграция: Home — `DailyNutritionSummary compact` для Pro Max; Profile — `NutritionTeaserCard`; `_layout.tsx` — nutrition stack с `href: null`
- Тесты: 230 (181 из Iter 0–4 + 49 новых), все зелёные
- Спека: `docs/superpowers/specs/2026-05-10-iteration-5-nutrition-design.md`
- План: `docs/superpowers/plans/2026-05-10-iteration-5-nutrition.md`

**Применено через CLI (2026-05-11):**

- Миграция `20260510000000_nutrition.sql` — применена через `supabase migration repair`
- Seed (74 продукта) — залит через `npx supabase db query --linked`
- Тестовый аккаунт `test@mail.ru` — `subscription_tier` установлен в `pro_max`

**Ожидает ручного применения:**

- Push-уведомления (Итерация 4) — отложены до EAS dev build

## Что реализовано (Итерация 4 — офлайн-часть)

- Зависимости: `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `@react-native-community/netinfo`, `expo-file-system`
- `src/lib/storage.ts` — новые ключи `rqPersistorBuster`, `mediaCacheIndex`; хелперы `getJSON<T>` / `setJSON<T>`
- `src/services/queryClient.ts` — `persister` (AsyncStorage, key `rq.cache.v1`), `persistOptions` (maxAge 7 дней, `shouldDehydrateQuery` для exercises/workouts/programs/blog, пропускает video-url/gif-url/search/rc); `networkMode: 'offlineFirst'` для queries, `'online'` для mutations
- `app/_layout.tsx` — `PersistQueryClientProvider`, `OfflineBanner`, `mediaCache.init()`
- `src/store/network.store.ts` — Zustand + NetInfo подписка
- `src/hooks/useNetworkStatus.ts` — `{ isOnline: boolean }`
- `src/lib/mediaCache.ts` — LRU-кэш 500 MB, index в AsyncStorage, дедупликация через inFlight Map, гистерезис 90%
- `src/hooks/useCachedMediaUri.ts` — мгновенный remote URL + фоновая загрузка → swap на `file://`
- `src/components/shared/OfflineBanner.tsx` — 28px BlurView полоска, slide-in Reanimated
- `src/components/shared/OfflineBadge.tsx` — pill «Офлайн» через `useSyncExternalStore`
- `app/(tabs)/exercises/[slug].tsx` — `useCachedMediaUri` для видео и GIF, `OfflineBadge`
- `src/components/shared/ExerciseRow.tsx` — `OfflineBadge` для GIF
- `app/(tabs)/profile.tsx` — секция «Хранилище»: размер, кол-во файлов, кнопки очистки
- `src/store/auth.store.ts` — signOut очищает persister + queryClient + mediaCache + buster
- Тесты: 181 (156 из Iter 0–3 + 25 новых), все зелёные

## Что реализовано (Итерация 3)

- Dev Build: `eas.json` (development/preview/production профили), `expo-dev-client`, `react-native-purchases` v10+
- DB: миграция `20260509000000_subscriptions.sql` — `subscription_status_enum`, 6 новых колонок в `profiles`, таблица `subscription_events` (idempotency log), RPC `refresh_my_subscription_tier`
- DB типы обновлены в `database.types.ts` (subscription_status_enum, subscription_events, новые поля profiles)
- RevenueCat: `src/lib/revenuecat.ts` (singleton configureRevenueCat), SDK init в `app/_layout.tsx`
- `features/subscription/api/*` — обёртки: getOfferings, purchasePackage (с userCancelled), restorePurchases, getCustomerInfo, identifyUser/resetUser
- `features/subscription/lib/mapEntitlementsToTier.ts` — маппинг entitlements → максимальный tier
- `features/subscription/lib/tierFeatures.ts` — тексты тарифов
- `features/subscription/hooks/*` — useOfferings, useCustomerInfo (live updates listener), usePurchase (+ refetch profile + RPC), useRestore, useSubscriptionSummary
- Auth lifecycle: `auth.store.ts` — `identifyUser` при login, `resetUser` при signOut
- Shared компоненты: `PlanCard.tsx` (glass-карточка плана), `SubscriptionSummaryCard.tsx` (управление из профиля)
- Paywall: `app/paywall.tsx` — модальный экран с 3 планами, Restore Purchases; зарегистрирован в root Stack
- `PaywallCard.tsx` обновлён — по умолчанию открывает `/paywall?required=<tier>`
- Profile: заменён placeholder секции подписки на `<SubscriptionSummaryCard />`
- Tier-gate: home.tsx — проверка доступа при тапе на workout/program (→ paywall), free-tier баннер
- Edge Function: `supabase/functions/revenuecat-webhook/index.ts` — webhook с bearer auth, idempotency, маппинг 8 типов событий → profiles update
- Тесты: 156 (144 из Iter 1-2 + 12 новых), все зелёные; mock react-native-purchases в jest.setup.ts
- Plan: `docs/superpowers/plans/2026-05-09-iteration-3-subscriptions.md`

**Ожидает ручного применения:**

- Миграция: `supabase/migrations/20260509000000_subscriptions.sql` → Supabase Dashboard или `npx supabase db push`
- RC Dashboard: создать entitlements (basic/pro/pro_max), products в App Store Connect + Google Play, offering `default`, webhook URL + secret
- `.env` добавить: `EXPO_PUBLIC_RC_API_KEY_IOS`, `EXPO_PUBLIC_RC_API_KEY_ANDROID`
- Edge Function: задеплоить + выставить env `RC_WEBHOOK_SECRET`
- EAS: `npx eas login`, затем `npm run build:ios:dev`

## Что реализовано (Итерация 2)

- БД: 2 миграции (content + search), 6 таблиц, RLS, RPC `get_exercise_video_url` / `get_exercise_gif_url` / `search_content`
- Storage: 1 private (`exercise-media`) + 3 public buckets с admin-only write
- Seed: 10 упражнений, 5 тренировок, 2 программы, 3 поста
- Фичи: `features/exercises`, `features/workouts`, `features/programs`, `features/blog`, `features/search` — api, hooks, types
- Shared компоненты: TierBadge, DifficultyDots, PaywallCard, WorkoutCard, ProgramCard, BlogPostCard, ExerciseRow, QueryView
- Экраны: Home (дашборд), Workouts list/detail, Programs list/detail, Exercises detail (с tier-gated video), Blog list/detail, Search
- Tab bar: 6 вкладок (Home, Workouts, Programs, Search, Blog, Profile)
- Tier gate: серверная проверка в RPC + клиентская через `hasAccess`
- Тесты: 144 (62 из Iter 1 + 82 новых), все зелёные
- Спека: `docs/superpowers/specs/2026-05-06-iteration-2-content-design.md`
- План: `docs/superpowers/plans/2026-05-06-iteration-2-content.md`

## Что реализовано (Итерация 1)

- Supabase Auth: email/password + phone OTP
- `public.profiles` таблица с RLS и триггером `handle_new_user`
- `useAuthStore` — реальный Supabase, `hydrate()` + `onAuthStateChange`
- `useProfile` / `useUpdateProfile` (React Query)
- API-слой: `signInWithEmail`, `signUpWithEmail`, `signInWithPhone`, `verifyPhoneOtp`, `resetPassword`, `updatePassword`, `signOut`
- `mapAuthError` — маппинг Supabase error codes → русские сообщения
- `Segmented` UI-компонент (Email/Phone переключатель)
- Экраны: welcome (3-слайд онбординг), onboarding, sign-in, sign-up, verify-otp, forgot-password, reset-password, profile tab
- `app.config.ts` с env-переменными (Supabase URL + anon key)
- Jest + RNTL: 62 теста, все зелёные
- Миграция применена, `database.types.ts` сгенерирован из живой схемы
- Спека: `docs/superpowers/specs/2026-05-05-iteration-1-auth-design.md`
- План: `docs/superpowers/plans/2026-05-05-iteration-1-auth.md`

## Что реализовано (Итерация 0)

- TypeScript strict, ESLint, Prettier, Husky + lint-staged
- Expo Router: `(auth)` stack + `(tabs)` 4-tab layout (все экраны — заглушки)
- Дизайн-система: токены (colors, spacing, radii, typography, shadows, blur), ThemeProvider, useTheme
- UI-кит: Button, Input, Card (base + glass), Text, Screen
- Zustand: mock `useAuthStore` (`isAuthenticated: false`)
- React Query: `QueryClient` настроен
- AsyncStorage wrapper (`src/lib/storage.ts`) с типизированными ключами
- Jest + RNTL: 13 тестов, все зелёные
- Auth-gate в `app/_layout.tsx` (mock → редирект на onboarding)

## Соглашения

- После завершения итерации обновить статус и дату в таблице выше
- Следующую итерацию начинать с нового чата, передав ссылку на этот файл
- Планы итераций: `docs/superpowers/plans/`
- Спеки: `docs/superpowers/specs/`
