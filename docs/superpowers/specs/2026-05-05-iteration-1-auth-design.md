# Итерация 1 — Auth (Supabase) + Onboarding

## Контекст

Итерация 0 (фундамент) завершена: TS strict, Expo Router каркас (`(auth)` + `(tabs)`),
дизайн-система (Button/Input/Card/Text/Screen), Zustand mock-store с `isAuthenticated: boolean`,
ESLint/Prettier/Husky, Jest 13/13 зелёных, Expo Go-совместимо.

Итерация 1 — заменить mock на реальную Supabase Auth: email + телефон (OTP), запомнить
сессию, обновить flow onboarding → auth → tabs. Ничего бизнес-логики (workouts/blog/subscriptions)
не трогаем — это Итерации 2+.

## Решения, зафиксированные в брейнсторме

| Тема               | Решение                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Способы входа      | Email/password + Phone OTP. Apple/Google — отдельная итерация после ухода с Expo Go                                                                                   |
| Supabase проект    | Существующий `kmvkahweelgsjlzawuyy` ("VadikZyryanov's Mobile app", eu-central-1). Чистый, ноль таблиц                                                                 |
| SMS-провайдер      | Не подключаем. Тестовые номера в Supabase Dashboard для dev. Twilio — отдельный шаг перед prod                                                                        |
| Email confirmation | OFF на dev, включится в Dashboard перед prod. Password reset делаем                                                                                                   |
| Profile schema     | Минимальная (`id`, `display_name`, `avatar_url`, `created_at`, `updated_at`) + RLS + триггер на signup. Поля под подписки/прогресс — миграциями в следующих итерациях |
| Архитектура auth   | Zustand `useAuthStore` как фасад над `supabase.auth`. На старте `hydrate()` + сабскрайб на `onAuthStateChange`. React Query только для profile-данных                 |
| Onboarding         | Multi-step: 3-слайдовый welcome (intro) → экран выбора Sign in/Sign up. Флаг `onboarding.completed` в AsyncStorage                                                    |

## Цели итерации

1. Supabase client + конфиг через `app.config.ts` + `.env`
2. Миграция `profiles` + RLS + триггер автосоздания на signup
3. Auth-store на onAuthStateChange, hydrate сессии при старте
4. Email auth: signup, signin, signout, password reset (с deep link)
5. Phone auth: запрос OTP + подтверждение OTP
6. Welcome-слайды (3 шт.) + AuthGate + обновлённый flow
7. Локализованные ошибки (`mapAuthError`)
8. Тесты на api-функции, store, mapAuthError, ключевые экраны

## Tech additions

- `@supabase/supabase-js`
- `react-native-url-polyfill`
- `dotenv` (для `app.config.ts`)

## Структура файлов после итерации

```
mobile-app/
├── app/
│   ├── _layout.tsx                          # MODIFIED: AuthGate + hydrate()
│   ├── index.tsx                            # MODIFIED: status + onboarding flag
│   └── (auth)/
│       ├── _layout.tsx                      # без изменений
│       ├── welcome.tsx                      # NEW: 3-слайдовый intro
│       ├── onboarding.tsx                   # MODIFIED: убран mock, остался выбор Sign in/Sign up
│       ├── sign-in.tsx                      # MODIFIED: real Email + Phone сегменты
│       ├── sign-up.tsx                      # MODIFIED: real signup
│       ├── verify-otp.tsx                   # NEW: ввод SMS-кода
│       ├── forgot-password.tsx              # NEW: запрос сброса
│       └── reset-password.tsx               # NEW: deep-link target, новый пароль
├── src/
│   ├── lib/
│   │   ├── supabase.ts                      # NEW: Supabase client (singleton)
│   │   ├── database.types.ts                # NEW: сгенерённые типы (через MCP)
│   │   └── storage.ts                       # MODIFIED: + onboardingCompleted key
│   ├── store/
│   │   └── auth.store.ts                    # MODIFIED: session/user/status/hydrate/signOut
│   ├── features/
│   │   └── auth/                            # NEW
│   │       ├── api/
│   │       │   ├── signInWithEmail.ts
│   │       │   ├── signUpWithEmail.ts
│   │       │   ├── signInWithPhone.ts       # отправка OTP
│   │       │   ├── verifyPhoneOtp.ts
│   │       │   ├── resetPassword.ts         # запрос email-ссылки
│   │       │   ├── updatePassword.ts        # смена пароля после reset
│   │       │   ├── signOut.ts
│   │       │   └── *.test.ts (на каждую)
│   │       ├── hooks/
│   │       │   ├── useProfile.ts            # React Query → public.profiles
│   │       │   └── useUpdateProfile.ts
│   │       └── lib/
│   │           ├── mapAuthError.ts
│   │           └── mapAuthError.test.ts
│   └── components/ui/
│       └── Segmented/                       # NEW: переключатель Email/Телефон
│           ├── Segmented.tsx
│           ├── Segmented.test.tsx
│           └── index.ts
├── supabase/
│   └── migrations/
│       └── 20260505000000_profiles.sql      # NEW
├── app.config.ts                            # NEW: заменяет app.json (читает .env)
├── app.json                                 # DELETED
├── .env                                     # NEW: gitignored
├── .env.example                             # NEW: в репо
├── CLAUDE.md                                # MODIFIED: Auth раздел (mock → Supabase)
├── docs/design-system.md                    # MODIFIED: + Segmented в таблицу
└── jest.setup.ts                            # MODIFIED: + mock supabase client
```

## Supabase: схема БД, RLS, триггер

### Миграция `20260505000000_profiles.sql`

```sql
-- profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- INSERT через триггер с security definer; политики на insert/delete не нужны
```

### Конфигурация Supabase Dashboard (через MCP / вручную)

1. **Auth → Providers → Email**: `Confirm email = OFF` (на dev)
2. **Auth → Providers → Phone**: включить, провайдер не задавать. Test OTP:
   ```
   +79991234567 → 123456
   +79991234568 → 654321
   ```
3. **Auth → URL Configuration → Redirect URLs**: добавить `fitnessapp://auth/reset-password`

### Типы БД

После применения миграции — `mcp__supabase__generate_typescript_types` →
сохраняем в `src/lib/database.types.ts`. Supabase client типизируется как
`SupabaseClient<Database>`.

## Auth-store + Supabase client

### `src/lib/supabase.ts`

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import type { Database } from './database.types';

const url = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

if (!url || !anonKey) {
  throw new Error('Missing Supabase env vars. Check .env and app.config.ts.');
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### `app.config.ts` (заменяет `app.json`)

```ts
import 'dotenv/config';

export default {
  expo: {
    /* ...всё из app.json без изменений... */
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

`.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://kmvkahweelgsjlzawuyy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

`.env` добавляется в `.gitignore`. `.env.example` — без значений, в репо.

### `src/store/auth.store.ts` (расширенная)

```ts
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  user: null,

  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      status: data.session ? 'authenticated' : 'unauthenticated',
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
      });
    });
  },

  signOut: async () => {
    await signOutApi(); // делегирует в features/auth/api/signOut.ts
  },
}));
```

### `features/auth/api/*` — паттерн

Тонкие функции, без хуков, без UI. Все вызовы `supabase.auth.*` живут только здесь
(включая `signOut`). Возвращают `Result`:

```ts
type AuthResult = { ok: true } | { ok: false; error: string };

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

Стор обновится автоматически через `onAuthStateChange` — api-функции состоянием
не управляют. Store-метод `signOut` — единственная пара store/api: его API-обёртка
нужна для согласованности (одно место для `mapAuthError` + единая поверхность для
тестов), а store-метод нужен, чтобы UI вызывал `useAuthStore.getState().signOut()`
вместо прямого импорта api-функции (симметрично с `hydrate`, который тоже
оркестрирует supabase, но живёт в сторе).

### `mapAuthError.ts`

Switch по `error.code` / `error.message`. Минимальный набор:

| Код                          | Сообщение                                     |
| ---------------------------- | --------------------------------------------- |
| `invalid_credentials`        | "Неверный email или пароль"                   |
| `email_not_confirmed`        | "Подтвердите email"                           |
| `over_email_send_rate_limit` | "Слишком много запросов, подождите минуту"    |
| `over_request_rate_limit`    | "Слишком много запросов, подождите минуту"    |
| `otp_expired`                | "Код устарел, запросите новый"                |
| `otp_disabled`               | "Вход по коду временно недоступен"            |
| `weak_password`              | "Пароль слишком простой (минимум 8 символов)" |
| `user_already_exists`        | "Аккаунт с таким email уже существует"        |
| default                      | `error.message` (английское fallback)         |

## Экраны и навигационный flow

### `app/_layout.tsx` — AuthGate

```tsx
function AuthGate({ children }) {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, []);

  if (status === 'loading') {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }
  return children;
}
```

Оборачивает `<Slot />` внутри RootLayout.

### `app/index.tsx`

```tsx
const status = useAuthStore((s) => s.status);
const [target, setTarget] = useState<string | null>(null);

useEffect(() => {
  if (status === 'authenticated') {
    setTarget('/(tabs)/home');
  } else if (status === 'unauthenticated') {
    storage.get(StorageKeys.onboardingCompleted).then((seen) => {
      setTarget(seen === 'true' ? '/(auth)/onboarding' : '/(auth)/welcome');
    });
  }
}, [status]);

if (!target) return null;
return <Redirect href={target} />;
```

### Welcome (`app/(auth)/welcome.tsx`) — 3-слайдовый intro

Контент:

```
Слайд 1
  Title:  "Тренировки на каждый день"
  Body:   "Готовые программы и отдельные тренировки для дома и зала."
  Visual: emoji 💪 в Card glass

Слайд 2
  Title:  "Блог тренера"
  Body:   "Разборы техники, советы по восстановлению, новости в твоём фиде."
  Visual: emoji 📝

Слайд 3
  Title:  "Твой прогресс остаётся с тобой"
  Body:   "История тренировок, любимые программы, индивидуальный план — всё синхронизируется."
  Visual: emoji 📈
```

Реализация:

- Горизонтальный `FlatList` с `pagingEnabled` (RN-нативный, без сторонних либ)
- Точечный индикатор внизу (3 точки, активная — `accent`)
- Кнопки: «Пропустить» (top-right на всех слайдах), «Дальше» (на 1–2), «Начать» (на 3)
- На «Начать» / «Пропустить» — `await storage.set(StorageKeys.onboardingCompleted, 'true')` + `router.replace('/(auth)/onboarding')`

### Onboarding (`app/(auth)/onboarding.tsx`) — экран выбора Sign in/Sign up

Минимальная переделка существующего:

- Убрать кнопку «Продолжить (mock)» и весь mock-флоу
- Оставить «Войти» (→ `sign-in`) и «Создать аккаунт» (→ `sign-up`)
- Текст без отсылок к "Итерация 0"

### Sign-in (`app/(auth)/sign-in.tsx`) — переделывается

```
[ Email | Телефон ]   ← Segmented

Если Email:                  Если Телефон:
  Input email                Input phone (формат +79991234567)
  Input password             [Получить код]
  [Войти]
  [Забыли пароль?]
```

Локальный `useState`: `loading`, `error`. На submit:

- Email → `signInWithEmail` → при `{ok: true}` ничего не делаем (AuthGate перенаправит); при `{ok: false}` показываем `error` под кнопкой
- Телефон → `signInWithPhone(phone)` → при `{ok: true}` `router.push('/(auth)/verify-otp?phone=' + encodeURIComponent(phone))`

### Verify OTP (`app/(auth)/verify-otp.tsx`) — NEW

Один Input для 6-значного кода + кнопка «Подтвердить» + «Отправить ещё раз» (с 60-сек cooldown через `useState` + `setInterval`). На submit — `verifyPhoneOtp(phone, code)`. При успехе — `onAuthStateChange` сам срабатывает, AuthGate перенаправит в `(tabs)`.

### Sign-up (`app/(auth)/sign-up.tsx`) — переделывается

Email + password + опционально display_name. На submit — `signUpWithEmail`. На dev (confirm OFF) юзер сразу залогинен → AuthGate перенаправляет.

### Forgot password (`app/(auth)/forgot-password.tsx`) — NEW

Один Input email + «Отправить ссылку». На submit — `resetPassword(email, redirectTo: 'fitnessapp://auth/reset-password')`. После успеха — экран-подтверждение «Письмо отправлено на {email}, проверьте почту».

### Reset password (`app/(auth)/reset-password.tsx`) — NEW (deep link target)

Открывается по ссылке из письма. Supabase автоматически устанавливает сессию (event `PASSWORD_RECOVERY`). Экран: два Input (новый пароль + повтор) + «Сохранить». На submit — `updatePassword(newPassword)`. После успеха — `router.replace('/(tabs)/home')`.

### Profile tab (`app/(tabs)/profile.tsx`) — обновляется

- Email из `useAuthStore((s) => s.user?.email)`
- `display_name` из `useProfile()` (React Query → `public.profiles`)
- Кнопка «Выйти» → `await useAuthStore.getState().signOut()` → AuthGate возвращает в `(auth)`

## Тестирование

| Уровень      | Что                                                                     | Как                                                                                                                             |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Unit (api)   | каждая функция в `features/auth/api/*`                                  | мок `supabase.auth.*`, проверка `{ok: true}` / `{ok: false, error: 'русский текст'}`                                            |
| Unit (lib)   | `mapAuthError`                                                          | таблица: error code → ожидаемое сообщение                                                                                       |
| Unit (store) | `useAuthStore.hydrate`, `signOut`                                       | мок `supabase.auth`, проверка переходов status: loading → authenticated/unauthenticated                                         |
| Component    | `Segmented`                                                             | render + `fireEvent.press` → `onChange`, accessibility `role="tab"`                                                             |
| Component    | `welcome.tsx`                                                           | render всех слайдов через `fireEvent.scroll`, press кнопок пишет в storage и навигирует                                         |
| Component    | `sign-in`, `sign-up`, `verify-otp`, `forgot-password`, `reset-password` | render + ввод полей + press submit → проверка вызова api-функции с правильными аргументами; отдельный кейс на отображение error |

**НЕ покрываем:**

- Реальные сетевые вызовы в Supabase
- E2E через Detox/Maestro
- Deep link routing

### Setup

В `jest.setup.ts` добавляется глобальный мок Supabase:

```ts
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));
```

В тестах — переопределение через `(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce(...)`.

**Целевая метрика:** ~25–30 тестов суммарно к существующим 13. Прогон `jest --ci` < 5 сек. Snapshots для auth-кода не используем.

## Verification

### Тулинг

1. `npm install` — 0 ошибок
2. `npm run typecheck` — 0 (включая `database.types.ts`)
3. `npm run lint` — 0
4. `npm test` — все зелёные

### Supabase (через MCP перед началом E2E)

5. Миграция `20260505000000_profiles.sql` применена; `list_tables` показывает `public.profiles`
6. `get_advisors` (security): 0 ошибок (RLS включён, политики на месте)
7. Email confirmation OFF, тестовые номера прописаны (вручную в Dashboard)

### Runtime (Expo Go, iOS Simulator)

**Сценарий A — Welcome + Email signup:** 8. Первый старт: loader → `welcome` (3 слайда), свайп работает, индикатор обновляется 9. «Пропустить» → `(auth)/onboarding` 10. Закрыть и открыть приложение → welcome больше не показывается, сразу `onboarding` 11. «Создать аккаунт» → `test@example.com` + `password123` → submit → `(tabs)/home` 12. Tab Profile показывает email и `display_name = 'test'` 13. «Выйти» → возврат в `(auth)/onboarding` (не в welcome — флаг сохранён) 14. «Войти» → email/password → `(tabs)/home`

**Сценарий B — Phone OTP:** 15. Sign-in → `Segmented → Телефон` → `+79991234567` → «Получить код» → `verify-otp` 16. Ввод `123456` → submit → `(tabs)/home`

**Сценарий C — Password reset:** 17. Sign-in → «Забыли пароль?» → email → submit → экран «Письмо отправлено» 18. (Письмо приходит на реальный email — проверить вручную) 19. Клик по ссылке в письме → app открывается по deep link → `reset-password` → новый пароль → submit → `(tabs)/home`

**Сценарий D — Ошибки:** 20. Неверный пароль → красный текст «Неверный email или пароль» под кнопкой 21. Неподтверждённый OTP → «Код устарел, запросите новый»

**Сценарий E — Сессия:** 22. Закрыть приложение залогиненым → открыть снова → loader → сразу `(tabs)/home` (никакого `onboarding`)

### Git

23. `.env` в `.gitignore`
24. `git commit` без `--no-verify` — pre-commit (lint + typecheck) проходит

## Что НЕ входит в Итерацию 1

- Apple Sign-In, Google Sign-In — отдельная итерация после ухода с Expo Go (нужен dev build + платный Apple Developer)
- Реальный SMS-провайдер (Twilio) — переключатель в Dashboard перед prod
- Email confirmation на prod — переключатель в Dashboard
- Account linking (один человек ↔ email + phone) — позже, по необходимости
- Edge functions, кастомные claims, MFA — позже
- E2E-тесты, CI — отдельная итерация
- Production-иллюстрации в welcome — placeholder emoji сейчас, иллюстрации в дизайнерском треке
