# Roadmap & Progress

| #   | Итерация              | Статус         | Дата завершения |
| --- | --------------------- | -------------- | --------------- |
| 0   | Фундамент             | ✅ Done        | 2026-05-05      |
| 1   | Auth + Supabase       | ✅ Done        | 2026-05-06      |
| 2   | Backend MVP + контент | ✅ Done        | 2026-05-07      |
| 3   | Подписки (RevenueCat) | ✅ Done        | 2026-05-09      |
| 4   | Push + офлайн         | 🔄 In Progress |                 |
| 5   | Pro Max: питание      | ⬜ Planned     |                 |
| 6   | Админ-SPA             | ⬜ Planned     |                 |

## Текущая итерация

**Итерация 4** — Push + офлайн  
Офлайн-часть реализована (2026-05-09). Push-уведомления — следующим шагом после EAS dev build.

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
