# Roadmap & Progress

| #   | Итерация                       | Статус         | Дата завершения |
| --- | ------------------------------ | -------------- | --------------- |
| 0   | Фундамент                      | ✅ Done        | 2026-05-05      |
| 1   | Auth + Supabase                | ✅ Done        | 2026-05-06      |
| 2   | Backend MVP + контент          | ✅ Done        | 2026-05-07      |
| 3   | Подписки (RevenueCat)          | ✅ Done        | 2026-05-09      |
| 4   | Push + офлайн                  | 🔄 In Progress |                 |
| 5   | Pro Max: питание               | ✅ Done        | 2026-05-11      |
| 6a  | Админ-SPA: каркас + Users      | ✅ Done        | 2026-05-15      |
| 6b  | Админ-SPA: CRUD контента       | 📋 Planned     |                 |
| 6c  | Админ-SPA: метрики + audit log | 📋 Planned     |                 |
| 7   | Push: дожать Iter 4 на EAS     | 📋 Planned     |                 |
| 8   | Apple Health / Google Fit sync | 📋 Planned     |                 |

## Текущая итерация

Все итерации до 6a завершены. Следующая: **6b** (CRUD контента).

## План на будущие итерации

### Итерация 6b — Админ-SPA: CRUD контента

**Цель:** управление всем контентом приложения из админки без захода в Supabase Studio.

**Сущности (CRUD: list / create / edit / delete):**

- `exercises` — упражнения (имя, описание, техника, difficulty, мышечные группы, tier, video + gif)
- `workouts` — тренировки (имя, тип, длительность, tier, обложка) + связь `workout_exercises` (упражнения с sets/reps/rest, порядок)
- `programs` — программы (имя, длительность, tier, обложка) + связь `program_workouts` (тренировки по дням/неделям)
- `blog_posts` — посты блога (заголовок, обложка, markdown-контент, опубликовано/draft, published_at)
- `foods` — продукты для nutrition (имя, КБЖУ на 100г, категория)

**Storage uploads (через Supabase Storage):**

- Видео упражнений → `exercise-media` (private bucket, signed URL через существующий RPC `get_exercise_video_url`)
- GIF превью → `exercise-gifs` (public)
- Обложки тренировок/программ/постов → `workout-covers`, `program-covers`, `blog-covers` (public)
- UI: drag-n-drop, прогресс загрузки, валидация типа/размера, превью

**Markdown-редактор для `blog_posts.content`:**

- Кандидаты: `@uiw/react-md-editor` (split-view) или TipTap
- Превью с тем же рендером, что в мобилке (`react-native-markdown-display`)

**Открытые вопросы (решить перед стартом):**

1. Подход к видео: сырые файлы в Supabase Storage vs Mux/Cloudflare Stream (по CLAUDE.md планируется Mux)
2. Markdown vs MDX для блога
3. Soft delete vs hard delete для контента, на который есть ссылки из истории прогресса
4. Версионирование (snapshot) exercise/workout, чтобы не ломать архивные `workout_sessions`

**Definition of Done:**

- 5 экранов-списков с фильтрами/поиском + 5 форм create/edit + delete-confirmation
- Все uploads работают, файлы появляются в Supabase Storage и видны в мобилке
- Markdown-пост создаётся через админку и корректно рендерится в `app/(tabs)/blog/[slug].tsx`
- Tier-gating сохраняется (RLS не трогаем, только UI)

### Итерация 6c — Админ-SPA: метрики + audit log

**Цель:** наблюдаемость и аудит.

**Dashboard метрики:**

- DAU / MAU (graph за 30 дней)
- MRR / ARR — текущий и тренд
- Новые подписки по tier (basic/pro/pro_max) за период
- Churn rate (cancelled + expired) за период
- Распределение пользователей по tier (pie chart)
- Топ-N самых популярных тренировок/программ за период

**Источники данных:** агрегирующие SQL-views или materialized views (`mv_daily_active_users`, `mv_subscription_metrics`), обновляемые по cron.

**UI просмотра `admin_audit_log`:**

- Таблица всех записей: admin / action / target_user / created_at
- Фильтр по action (`subscription_override` пока единственное, но дизайн на расширение)
- Диалог с diff `before` / `after` (jsonb side-by-side)

**Возможно (TBD):**

- Экспорт метрик в CSV
- Алерты на резкий churn

### Итерация 7 — Push-уведомления (доделать Iter 4)

**Что осталось от Iter 4:** UI и Edge Function для push отложены до EAS Dev Build.

**Скоуп:**

- `expo-notifications` интеграция + регистрация push-токенов в `profiles.push_token`
- Edge Function `send-push` для отправки через Expo Push API
- Триггеры:
  - Новый blog post → broadcast всем
  - Подписка истекает через 3 дня / 1 день → targeted
  - Подписка успешно продлена / failed → targeted
  - Готов новый индивидуальный план (Pro tier) → targeted
- Админ-UI: push на сегменты (tier / последняя активность)
- iOS APNS + Android FCM сертификаты

**Зависимость:** EAS Dev Build должен быть собран и протестирован (Iter 3 закрыл подготовку, но физический билд ещё не делался).

### Итерация 8 — Интеграция с фитнес-трекерами (TBD)

Из CLAUDE.md «Scalability»:

- Apple Health (HealthKit) — workouts, шаги, ЧСС
- Google Fit / Health Connect — аналогично
- Garmin Connect API — опционально

**Подготовка уже сделана:** DB и API спроектированы расширяемо, без рефакторинга.

### Идеи без номера итерации

- Социальные функции: лента друзей, лайки на завершённые тренировки
- AI-генератор индивидуальных программ (на основе целей + истории)
- Apple/Google Sign-In (отложено с Iter 1 до dev build)
- 2FA для админов (отложено с Iter 6a)
- Bulk-actions + CSV-экспорт в админке
- Управление ролями (грант/ревок `is_admin`) через UI вместо SQL

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
