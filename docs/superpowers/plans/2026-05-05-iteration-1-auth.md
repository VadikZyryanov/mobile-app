# Iteration 1 — Auth (Supabase) + Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock auth with real Supabase Auth (email + phone OTP), add `profiles` table with RLS, multi-step welcome onboarding, password reset via deep link. Keep Expo Go compatibility.

**Architecture:** Zustand `useAuthStore` as facade over `supabase.auth`. `hydrate()` runs once at app start, subscribes to `onAuthStateChange`. Thin api functions in `features/auth/api/*` wrap each Supabase call and return `{ ok: true } | { ok: false, error: string }` with localized message via `mapAuthError`. React Query only for `profiles` row.

**Tech Stack:** `@supabase/supabase-js`, `react-native-url-polyfill`, `dotenv`, AsyncStorage (already installed), Zustand (already installed), React Query (already installed), Jest 29 + RNTL 13.

**Spec reference:** `docs/superpowers/specs/2026-05-05-iteration-1-auth-design.md`

**Notation:** All file paths absolute from repo root (`/Users/vadikzyranov/WebstormProjects/mobile-app/`). All test runs use `npm test -- --findRelatedTests <file>` for speed; full suite via `npm test`.

---

## Phase 1: Foundation

### Task 1: Install dependencies and prepare .env

**Files:**

- Modify: `package.json`
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Install runtime deps**

```bash
npm install --legacy-peer-deps @supabase/supabase-js react-native-url-polyfill
npm install --legacy-peer-deps -D dotenv
```

Expected: install succeeds, `package.json` updated.

- [ ] **Step 2: Create .env**

```
EXPO_PUBLIC_SUPABASE_URL=https://kmvkahweelgsjlzawuyy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
```

To get anon key, run via Supabase MCP:

```
mcp__supabase__get_publishable_keys(project_id="kmvkahweelgsjlzawuyy")
```

Use the legacy anon key (JWT, starts with `eyJ`).

- [ ] **Step 3: Create .env.example**

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Append to .gitignore**

Add at the bottom:

```
# Env
.env
.env.local
```

- [ ] **Step 5: Verify .env not tracked**

```bash
git check-ignore .env && echo "ignored OK"
```

Expected: prints `.env` then `ignored OK`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "feat(auth): add Supabase deps and env scaffolding"
```

---

### Task 2: Convert app.json → app.config.ts

**Files:**

- Create: `app.config.ts`
- Delete: `app.json`

- [ ] **Step 1: Create app.config.ts**

```ts
import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'mobile-app',
  slug: 'mobile-app',
  scheme: 'fitnessapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A0A',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.fitnessapp.mobile',
  },
  android: {
    package: 'com.fitnessapp.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0A',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
```

- [ ] **Step 2: Delete app.json**

```bash
rm app.json
```

- [ ] **Step 3: Verify config loads**

```bash
npx expo config --type public 2>&1 | head -30
```

Expected: prints JSON with `extra.supabaseUrl` populated.

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app.config.ts
git rm app.json
git commit -m "feat(auth): convert app.json to app.config.ts for env vars"
```

---

### Task 3: Apply Supabase migration (profiles + RLS + trigger)

**Files:**

- Create: `supabase/migrations/20260505000000_profiles.sql`

- [ ] **Step 1: Create migration file**

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
```

- [ ] **Step 2: Apply migration via MCP**

Call:

```
mcp__supabase__apply_migration(
  project_id="kmvkahweelgsjlzawuyy",
  name="profiles",
  query=<file contents above>
)
```

Expected: success.

- [ ] **Step 3: Verify schema**

Call:

```
mcp__supabase__list_tables(project_id="kmvkahweelgsjlzawuyy", schemas=["public"], verbose=true)
```

Expected: `public.profiles` listed with columns id, display_name, avatar_url, created_at, updated_at.

- [ ] **Step 4: Verify advisors clean**

Call:

```
mcp__supabase__get_advisors(project_id="kmvkahweelgsjlzawuyy", type="security")
```

Expected: 0 errors related to `profiles` (RLS enabled, policies present).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260505000000_profiles.sql
git commit -m "feat(db): add profiles table with RLS and signup trigger"
```

---

### Task 4: Generate database types

**Files:**

- Create: `src/lib/database.types.ts`

- [ ] **Step 1: Generate via MCP**

Call:

```
mcp__supabase__generate_typescript_types(project_id="kmvkahweelgsjlzawuyy")
```

Save the returned content to `src/lib/database.types.ts`.

- [ ] **Step 2: Verify file**

```bash
head -20 src/lib/database.types.ts
```

Expected: starts with `export type Json = ...` and has `Database` type with `public.profiles` schema.

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat(db): generate Supabase TypeScript types"
```

---

### Task 5: Configure Supabase Dashboard (manual)

**No code changes.** Done in browser by user.

- [ ] **Step 1: Open dashboard**

`https://supabase.com/dashboard/project/kmvkahweelgsjlzawuyy`

- [ ] **Step 2: Disable email confirmation (dev only)**

`Authentication → Sign In / Up → Email → Confirm email = OFF`. Save.

- [ ] **Step 3: Enable phone provider with test numbers**

`Authentication → Sign In / Up → Phone → Enable Phone provider`. SMS provider — leave default/skip. Add test phone numbers:

```
+79991234567 → 123456
+79991234568 → 654321
```

Save.

- [ ] **Step 4: Add redirect URL**

`Authentication → URL Configuration → Redirect URLs → Add URL`:

```
fitnessapp://auth/reset-password
```

Save.

- [ ] **Step 5: Confirm via screenshots in chat**

User reports back that 3 settings are saved. No git commit (no code).

---

### Task 6: Create Supabase client

**Files:**

- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Write client**

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

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat(auth): add Supabase client singleton"
```

---

### Task 7: Update jest.setup.ts with Supabase mock

**Files:**

- Modify: `jest.setup.ts`

- [ ] **Step 1: Add mock**

Append to `jest.setup.ts`:

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
  },
}));
```

- [ ] **Step 2: Run existing tests to confirm no regression**

```bash
npm test
```

Expected: 13/13 still pass.

- [ ] **Step 3: Commit**

```bash
git add jest.setup.ts
git commit -m "test(auth): add global Supabase mock to jest setup"
```

---

### Task 8: Add onboardingCompleted storage key

**Files:**

- Modify: `src/lib/storage.ts`

- [ ] **Step 1: Add key**

Modify `StorageKeys` const:

```ts
export const StorageKeys = {
  authToken: 'auth.token',
  authUserId: 'auth.userId',
  themeOverride: 'settings.themeOverride',
  onboardingCompleted: 'onboarding.completed',
} as const;
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/storage.ts
git commit -m "feat(storage): add onboardingCompleted key"
```

---

## Phase 2: API layer (TDD)

> **Pattern reminder:** every api function follows the shape:
>
> ```ts
> type AuthResult = { ok: true } | { ok: false; error: string };
> ```
>
> Define this once in `src/features/auth/api/types.ts` (Task 9 first).

### Task 9: Define AuthResult type and mapAuthError

**Files:**

- Create: `src/features/auth/api/types.ts`
- Create: `src/features/auth/lib/mapAuthError.ts`
- Test: `src/features/auth/lib/mapAuthError.test.ts`

- [ ] **Step 1: Create types file**

```ts
// src/features/auth/api/types.ts
export type AuthResult = { ok: true } | { ok: false; error: string };
```

- [ ] **Step 2: Write failing tests for mapAuthError**

```ts
// src/features/auth/lib/mapAuthError.test.ts
import type { AuthError } from '@supabase/supabase-js';

import { mapAuthError } from './mapAuthError';

const make = (code: string, message = 'fallback'): AuthError =>
  ({ code, message, name: 'AuthError', status: 400 }) as unknown as AuthError;

describe('mapAuthError', () => {
  it.each([
    ['invalid_credentials', 'Неверный email или пароль'],
    ['email_not_confirmed', 'Подтвердите email'],
    ['over_email_send_rate_limit', 'Слишком много запросов, подождите минуту'],
    ['over_request_rate_limit', 'Слишком много запросов, подождите минуту'],
    ['otp_expired', 'Код устарел, запросите новый'],
    ['otp_disabled', 'Вход по коду временно недоступен'],
    ['weak_password', 'Пароль слишком простой (минимум 8 символов)'],
    ['user_already_exists', 'Аккаунт с таким email уже существует'],
  ])('код "%s" → "%s"', (code, expected) => {
    expect(mapAuthError(make(code))).toBe(expected);
  });

  it('возвращает message для неизвестного кода', () => {
    expect(mapAuthError(make('something_unknown', 'Raw msg'))).toBe('Raw msg');
  });

  it('возвращает дефолт если нет message', () => {
    const err = { code: 'x', name: 'AuthError', status: 0 } as unknown as AuthError;
    expect(mapAuthError(err)).toBe('Произошла ошибка. Попробуйте ещё раз.');
  });
});
```

- [ ] **Step 3: Run test (should fail — no impl)**

```bash
npm test -- --findRelatedTests src/features/auth/lib/mapAuthError.test.ts
```

Expected: FAIL `Cannot find module './mapAuthError'`.

- [ ] **Step 4: Implement mapAuthError**

```ts
// src/features/auth/lib/mapAuthError.ts
import type { AuthError } from '@supabase/supabase-js';

const MAP: Record<string, string> = {
  invalid_credentials: 'Неверный email или пароль',
  email_not_confirmed: 'Подтвердите email',
  over_email_send_rate_limit: 'Слишком много запросов, подождите минуту',
  over_request_rate_limit: 'Слишком много запросов, подождите минуту',
  otp_expired: 'Код устарел, запросите новый',
  otp_disabled: 'Вход по коду временно недоступен',
  weak_password: 'Пароль слишком простой (минимум 8 символов)',
  user_already_exists: 'Аккаунт с таким email уже существует',
};

export function mapAuthError(error: AuthError): string {
  if (error.code && MAP[error.code]) return MAP[error.code];
  if (error.message) return error.message;
  return 'Произошла ошибка. Попробуйте ещё раз.';
}
```

- [ ] **Step 5: Run test (should pass)**

```bash
npm test -- --findRelatedTests src/features/auth/lib/mapAuthError.test.ts
```

Expected: PASS, all 10 cases green.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/api/types.ts src/features/auth/lib/mapAuthError.ts src/features/auth/lib/mapAuthError.test.ts
git commit -m "feat(auth): add AuthResult type and mapAuthError"
```

---

### Task 10: signInWithEmail

**Files:**

- Create: `src/features/auth/api/signInWithEmail.ts`
- Test: `src/features/auth/api/signInWithEmail.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/features/auth/api/signInWithEmail.test.ts
import { supabase } from '@/lib/supabase';
import { signInWithEmail } from './signInWithEmail';

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;

describe('signInWithEmail', () => {
  beforeEach(() => mockSignIn.mockReset());

  it('возвращает ok при успехе', async () => {
    mockSignIn.mockResolvedValueOnce({ data: {}, error: null });
    const res = await signInWithEmail('a@b.c', 'pw');
    expect(res).toEqual({ ok: true });
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' });
  });

  it('возвращает локализованную ошибку при invalid_credentials', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: {},
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    const res = await signInWithEmail('a@b.c', 'pw');
    expect(res).toEqual({ ok: false, error: 'Неверный email или пароль' });
  });
});
```

- [ ] **Step 2: Run (FAIL — no impl)**

```bash
npm test -- --findRelatedTests src/features/auth/api/signInWithEmail.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/features/auth/api/signInWithEmail.ts
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

- [ ] **Step 4: Run (PASS)**

```bash
npm test -- --findRelatedTests src/features/auth/api/signInWithEmail.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/api/signInWithEmail.ts src/features/auth/api/signInWithEmail.test.ts
git commit -m "feat(auth): add signInWithEmail api"
```

---

### Task 11: signUpWithEmail

**Files:**

- Create: `src/features/auth/api/signUpWithEmail.ts`
- Test: `src/features/auth/api/signUpWithEmail.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { supabase } from '@/lib/supabase';
import { signUpWithEmail } from './signUpWithEmail';

const mock = supabase.auth.signUp as jest.Mock;

describe('signUpWithEmail', () => {
  beforeEach(() => mock.mockReset());

  it('передаёт email и password без displayName', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await signUpWithEmail('a@b.c', 'pw12345678');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw12345678' });
  });

  it('передаёт display_name через options.data', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    await signUpWithEmail('a@b.c', 'pw12345678', 'Vadim');
    expect(mock).toHaveBeenCalledWith({
      email: 'a@b.c',
      password: 'pw12345678',
      options: { data: { display_name: 'Vadim' } },
    });
  });

  it('возвращает локализованную ошибку при weak_password', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'weak_password', message: 'weak' },
    });
    const res = await signUpWithEmail('a@b.c', '123');
    expect(res).toEqual({ ok: false, error: 'Пароль слишком простой (минимум 8 символов)' });
  });
});
```

- [ ] **Step 2: Run (FAIL)**

```bash
npm test -- --findRelatedTests src/features/auth/api/signUpWithEmail.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/features/auth/api/signUpWithEmail.ts
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    ...(displayName ? { options: { data: { display_name: displayName } } } : {}),
  });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

- [ ] **Step 4: Run (PASS)**

```bash
npm test -- --findRelatedTests src/features/auth/api/signUpWithEmail.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/api/signUpWithEmail.ts src/features/auth/api/signUpWithEmail.test.ts
git commit -m "feat(auth): add signUpWithEmail api"
```

---

### Task 12: signInWithPhone (request OTP)

**Files:**

- Create: `src/features/auth/api/signInWithPhone.ts`
- Test: `src/features/auth/api/signInWithPhone.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { supabase } from '@/lib/supabase';
import { signInWithPhone } from './signInWithPhone';

const mock = supabase.auth.signInWithOtp as jest.Mock;

describe('signInWithPhone', () => {
  beforeEach(() => mock.mockReset());

  it('запрашивает OTP по номеру', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await signInWithPhone('+79991234567');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ phone: '+79991234567' });
  });

  it('возвращает ошибку при rate limit', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'over_request_rate_limit', message: 'rate' },
    });
    const res = await signInWithPhone('+79991234567');
    expect(res).toEqual({ ok: false, error: 'Слишком много запросов, подождите минуту' });
  });
});
```

- [ ] **Step 2: Run (FAIL)**

```bash
npm test -- --findRelatedTests src/features/auth/api/signInWithPhone.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/features/auth/api/signInWithPhone.ts
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signInWithPhone(phone: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

- [ ] **Step 4: Run (PASS)**

```bash
npm test -- --findRelatedTests src/features/auth/api/signInWithPhone.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/api/signInWithPhone.ts src/features/auth/api/signInWithPhone.test.ts
git commit -m "feat(auth): add signInWithPhone api"
```

---

### Task 13: verifyPhoneOtp

**Files:**

- Create: `src/features/auth/api/verifyPhoneOtp.ts`
- Test: `src/features/auth/api/verifyPhoneOtp.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { supabase } from '@/lib/supabase';
import { verifyPhoneOtp } from './verifyPhoneOtp';

const mock = supabase.auth.verifyOtp as jest.Mock;

describe('verifyPhoneOtp', () => {
  beforeEach(() => mock.mockReset());

  it('подтверждает код типа sms', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await verifyPhoneOtp('+79991234567', '123456');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ phone: '+79991234567', token: '123456', type: 'sms' });
  });

  it('возвращает локализованную ошибку при otp_expired', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'otp_expired', message: 'expired' },
    });
    const res = await verifyPhoneOtp('+79991234567', '123456');
    expect(res).toEqual({ ok: false, error: 'Код устарел, запросите новый' });
  });
});
```

- [ ] **Step 2: Run (FAIL), then implement, then PASS**

```ts
// src/features/auth/api/verifyPhoneOtp.ts
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function verifyPhoneOtp(phone: string, token: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

- [ ] **Step 3: Run tests + commit**

```bash
npm test -- --findRelatedTests src/features/auth/api/verifyPhoneOtp.test.ts
git add src/features/auth/api/verifyPhoneOtp.ts src/features/auth/api/verifyPhoneOtp.test.ts
git commit -m "feat(auth): add verifyPhoneOtp api"
```

---

### Task 14: resetPassword

**Files:**

- Create: `src/features/auth/api/resetPassword.ts`
- Test: `src/features/auth/api/resetPassword.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { supabase } from '@/lib/supabase';
import { resetPassword } from './resetPassword';

const mock = supabase.auth.resetPasswordForEmail as jest.Mock;

describe('resetPassword', () => {
  beforeEach(() => mock.mockReset());

  it('передаёт email и redirect URL', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await resetPassword('a@b.c');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith('a@b.c', {
      redirectTo: 'fitnessapp://auth/reset-password',
    });
  });

  it('возвращает ошибку при rate limit', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'over_email_send_rate_limit', message: 'rate' },
    });
    const res = await resetPassword('a@b.c');
    expect(res).toEqual({ ok: false, error: 'Слишком много запросов, подождите минуту' });
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/features/auth/api/resetPassword.ts
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

const REDIRECT_URL = 'fitnessapp://auth/reset-password';

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: REDIRECT_URL,
  });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests src/features/auth/api/resetPassword.test.ts
git add src/features/auth/api/resetPassword.ts src/features/auth/api/resetPassword.test.ts
git commit -m "feat(auth): add resetPassword api"
```

---

### Task 15: updatePassword

**Files:**

- Create: `src/features/auth/api/updatePassword.ts`
- Test: `src/features/auth/api/updatePassword.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { supabase } from '@/lib/supabase';
import { updatePassword } from './updatePassword';

const mock = supabase.auth.updateUser as jest.Mock;

describe('updatePassword', () => {
  beforeEach(() => mock.mockReset());

  it('передаёт новый пароль', async () => {
    mock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await updatePassword('newpassword123');
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith({ password: 'newpassword123' });
  });

  it('возвращает локализованную ошибку при weak_password', async () => {
    mock.mockResolvedValueOnce({
      data: {},
      error: { code: 'weak_password', message: 'weak' },
    });
    const res = await updatePassword('123');
    expect(res).toEqual({ ok: false, error: 'Пароль слишком простой (минимум 8 символов)' });
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/features/auth/api/updatePassword.ts
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests src/features/auth/api/updatePassword.test.ts
git add src/features/auth/api/updatePassword.ts src/features/auth/api/updatePassword.test.ts
git commit -m "feat(auth): add updatePassword api"
```

---

### Task 16: signOut

**Files:**

- Create: `src/features/auth/api/signOut.ts`
- Test: `src/features/auth/api/signOut.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { supabase } from '@/lib/supabase';
import { signOut } from './signOut';

const mock = supabase.auth.signOut as jest.Mock;

describe('signOut', () => {
  beforeEach(() => mock.mockReset());

  it('вызывает supabase.auth.signOut', async () => {
    mock.mockResolvedValueOnce({ error: null });
    const res = await signOut();
    expect(res).toEqual({ ok: true });
    expect(mock).toHaveBeenCalled();
  });

  it('возвращает ошибку при сбое', async () => {
    mock.mockResolvedValueOnce({ error: { code: 'something', message: 'Boom' } });
    const res = await signOut();
    expect(res).toEqual({ ok: false, error: 'Boom' });
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/features/auth/api/signOut.ts
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '../lib/mapAuthError';
import type { AuthResult } from './types';

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests src/features/auth/api/signOut.test.ts
git add src/features/auth/api/signOut.ts src/features/auth/api/signOut.test.ts
git commit -m "feat(auth): add signOut api"
```

---

### Task 17: features/auth/api barrel

**Files:**

- Create: `src/features/auth/api/index.ts`

- [ ] **Step 1: Create barrel**

```ts
export * from './signInWithEmail';
export * from './signUpWithEmail';
export * from './signInWithPhone';
export * from './verifyPhoneOtp';
export * from './resetPassword';
export * from './updatePassword';
export * from './signOut';
export type { AuthResult } from './types';
```

- [ ] **Step 2: Verify typecheck + commit**

```bash
npm run typecheck
git add src/features/auth/api/index.ts
git commit -m "feat(auth): add api barrel export"
```

---

## Phase 3: Store

### Task 18: Refactor auth.store.ts (real Supabase)

**Files:**

- Modify: `src/store/auth.store.ts`
- Create: `src/store/auth.store.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/store/auth.store.test.ts
import { supabase } from '@/lib/supabase';
import { signOut as signOutApi } from '@/features/auth/api/signOut';
import { useAuthStore } from './auth.store';

jest.mock('@/features/auth/api/signOut');

const getSession = supabase.auth.getSession as jest.Mock;
const onAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const signOutMock = signOutApi as jest.Mock;

const reset = () => {
  useAuthStore.setState({ status: 'loading', session: null, user: null });
  getSession.mockReset();
  onAuthStateChange.mockReset();
  signOutMock.mockReset();
  onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
};

describe('useAuthStore', () => {
  beforeEach(reset);

  it('начинается с status=loading', () => {
    expect(useAuthStore.getState().status).toBe('loading');
  });

  it('hydrate без сессии → unauthenticated', async () => {
    getSession.mockResolvedValueOnce({ data: { session: null } });
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.status).toBe('unauthenticated');
    expect(s.user).toBeNull();
    expect(s.session).toBeNull();
  });

  it('hydrate с сессией → authenticated', async () => {
    const fakeSession = { access_token: 't', user: { id: 'u1', email: 'a@b.c' } };
    getSession.mockResolvedValueOnce({ data: { session: fakeSession } });
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.status).toBe('authenticated');
    expect(s.user?.id).toBe('u1');
    expect(s.session).toBe(fakeSession);
  });

  it('onAuthStateChange callback обновляет стор', async () => {
    getSession.mockResolvedValueOnce({ data: { session: null } });
    let cb: ((event: string, session: unknown) => void) | undefined;
    onAuthStateChange.mockImplementationOnce((fn) => {
      cb = fn;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    await useAuthStore.getState().hydrate();
    expect(cb).toBeDefined();

    const newSession = { access_token: 'x', user: { id: 'u2' } };
    cb!('SIGNED_IN', newSession);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user?.id).toBe('u2');

    cb!('SIGNED_OUT', null);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('signOut делегирует в api', async () => {
    signOutMock.mockResolvedValueOnce({ ok: true });
    await useAuthStore.getState().signOut();
    expect(signOutMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run (FAIL)**

```bash
npm test -- --findRelatedTests src/store/auth.store.test.ts
```

- [ ] **Step 3: Replace store implementation**

```ts
// src/store/auth.store.ts
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { signOut as signOutApi } from '@/features/auth/api/signOut';
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
    await signOutApi();
  },
}));
```

- [ ] **Step 4: Run (PASS)**

```bash
npm test -- --findRelatedTests src/store/auth.store.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/store/auth.store.ts src/store/auth.store.test.ts
git commit -m "feat(auth): wire auth store to Supabase via hydrate + onAuthStateChange"
```

---

## Phase 4: Profile hook

### Task 19: useProfile (React Query)

**Files:**

- Create: `src/features/auth/hooks/useProfile.ts`
- Test: `src/features/auth/hooks/useProfile.test.tsx`
- Create: `src/test-utils/queryWrapper.tsx`

- [ ] **Step 1: Create query wrapper test util**

```tsx
// src/test-utils/queryWrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export function makeQueryWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}
```

- [ ] **Step 2: Write failing test**

```tsx
// src/features/auth/hooks/useProfile.test.tsx
import { renderHook, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useProfile } from './useProfile';

const fromMock = supabase.from as jest.Mock;

describe('useProfile', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({ status: 'unauthenticated', user: null, session: null });
  });

  it('возвращает null если юзер не залогинен', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('фетчит profile по user.id', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.c' } as never,
      session: { access_token: 't' } as never,
    });
    const single = jest.fn().mockResolvedValueOnce({
      data: { id: 'u1', display_name: 'Vadim', avatar_url: null },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('id', 'u1');
    expect(result.current.data?.display_name).toBe('Vadim');
  });
});
```

- [ ] **Step 3: Implement**

```ts
// src/features/auth/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery<Profile | null>({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    },
  });
}
```

- [ ] **Step 4: Run + commit**

```bash
npm test -- --findRelatedTests src/features/auth/hooks/useProfile.test.tsx
git add src/features/auth/hooks/useProfile.ts src/features/auth/hooks/useProfile.test.tsx src/test-utils/queryWrapper.tsx
git commit -m "feat(auth): add useProfile hook"
```

---

### Task 20: useUpdateProfile

**Files:**

- Create: `src/features/auth/hooks/useUpdateProfile.ts`
- Test: `src/features/auth/hooks/useUpdateProfile.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';
import { useUpdateProfile } from './useUpdateProfile';

const fromMock = supabase.from as jest.Mock;

describe('useUpdateProfile', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1' } as never,
      session: {} as never,
    });
  });

  it('обновляет profile и инвалидирует кеш', async () => {
    const eq = jest.fn().mockResolvedValueOnce({ data: null, error: null });
    const update = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ update });

    const { Wrapper, client } = makeQueryWrapper();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper });
    await result.current.mutateAsync({ display_name: 'New' });

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith({ display_name: 'New' });
    expect(eq).toHaveBeenCalledWith('id', 'u1');
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile', 'u1'] }),
    );
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/features/auth/hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests src/features/auth/hooks/useUpdateProfile.test.tsx
git add src/features/auth/hooks/useUpdateProfile.ts src/features/auth/hooks/useUpdateProfile.test.tsx
git commit -m "feat(auth): add useUpdateProfile hook"
```

---

## Phase 5: UI atom

### Task 21: Segmented component

**Files:**

- Create: `src/components/ui/Segmented/Segmented.tsx`
- Create: `src/components/ui/Segmented/Segmented.test.tsx`
- Create: `src/components/ui/Segmented/index.ts`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Write failing test**

```tsx
// src/components/ui/Segmented/Segmented.test.tsx
import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Segmented } from './Segmented';

const OPTS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const;

describe('Segmented', () => {
  it('рендерит обе опции', () => {
    const { getByText } = renderWithTheme(
      <Segmented value="email" options={OPTS} onChange={() => {}} />,
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Phone')).toBeTruthy();
  });

  it('вызывает onChange при тапе', () => {
    const onChange = jest.fn();
    const { getByText } = renderWithTheme(
      <Segmented value="email" options={OPTS} onChange={onChange} />,
    );
    fireEvent.press(getByText('Phone'));
    expect(onChange).toHaveBeenCalledWith('phone');
  });

  it('подсвечивает выбранную (accessibilityState.selected)', () => {
    const { getByRole } = renderWithTheme(
      <Segmented value="phone" options={OPTS} onChange={() => {}} />,
    );
    const phoneTab = getByRole('tab', { name: 'Phone' });
    expect(phoneTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
  });
});
```

- [ ] **Step 2: Run (FAIL)**

```bash
npm test -- --findRelatedTests src/components/ui/Segmented/Segmented.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// src/components/ui/Segmented/Segmented.tsx
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from '../Text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.md,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.divider,
  };

  return (
    <View style={containerStyle}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              alignItems: 'center',
              borderRadius: theme.radii.sm,
              backgroundColor: selected ? theme.colors.surface : 'transparent',
            }}
          >
            <Text
              variant="body"
              weight={selected ? 'semibold' : 'regular'}
              color={selected ? 'text' : 'textMuted'}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Add barrel + UI index export**

```ts
// src/components/ui/Segmented/index.ts
export { Segmented } from './Segmented';
export type { SegmentedOption, SegmentedProps } from './Segmented';
```

Append to `src/components/ui/index.ts`:

```ts
export * from './Segmented';
```

- [ ] **Step 5: Run + commit**

```bash
npm test -- --findRelatedTests src/components/ui/Segmented/Segmented.test.tsx
git add src/components/ui/Segmented src/components/ui/index.ts
git commit -m "feat(ui): add Segmented component"
```

---

## Phase 6: Screens

### Task 22: AuthGate + index.tsx redirect logic

**Files:**

- Modify: `app/_layout.tsx`
- Modify: `app/index.tsx`

- [ ] **Step 1: Update app/\_layout.tsx**

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui';
import { queryClient } from '@/services/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { ThemeProvider, useTheme } from '@/theme';

function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const theme = useTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (status === 'loading') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </Screen>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="auto" />
            <AuthGate>
              <Slot />
            </AuthGate>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Update app/index.tsx**

```tsx
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { storage, StorageKeys } from '@/lib/storage';
import { useAuthStore } from '@/store/auth.store';

type Target = '/(tabs)/home' | '/(auth)/onboarding' | '/(auth)/welcome';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      setTarget('/(tabs)/home');
    } else if (status === 'unauthenticated') {
      void storage.get(StorageKeys.onboardingCompleted).then((seen) => {
        setTarget(seen === 'true' ? '/(auth)/onboarding' : '/(auth)/welcome');
      });
    }
  }, [status]);

  if (!target) return null;
  return <Redirect href={target} />;
}
```

- [ ] **Step 3: Verify typecheck + tests**

```bash
npm run typecheck && npm test
```

> **Note on typed routes:** `app/index.tsx` references `/(auth)/welcome` which doesn't exist as a file yet (created in Task 23). Expo Router's typed routes (`.expo/types/router.d.ts`) regenerates when files are added/removed. If typecheck fails here with "Type '"/(auth)/welcome"' is not assignable", either:
>
> - Run `npx expo start --clear` once to regenerate types, then quit, OR
> - Cast: `setTarget('/(auth)/welcome' as Target)` temporarily, OR
> - Defer this task's commit until after Task 23 (welcome screen) and run typecheck then.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/index.tsx
git commit -m "feat(auth): add AuthGate with hydrate and onboarding-aware index"
```

---

### Task 23: Welcome screen (3-slide intro)

**Files:**

- Create: `app/(auth)/welcome.tsx`
- Create: `app/(auth)/welcome.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// app/(auth)/welcome.test.tsx
import { fireEvent, waitFor } from '@testing-library/react-native';

import { storage, StorageKeys } from '@/lib/storage';
import { renderWithTheme } from '@/test-utils/render';
import WelcomeScreen from './welcome';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
import { router } from 'expo-router';

describe('WelcomeScreen', () => {
  beforeEach(async () => {
    (router.replace as jest.Mock).mockReset();
    await storage.clearAll();
  });

  it('рендерит первый слайд', () => {
    const { getByText } = renderWithTheme(<WelcomeScreen />);
    expect(getByText('Тренировки на каждый день')).toBeTruthy();
  });

  it('кнопка "Пропустить" пишет флаг и переходит на onboarding', async () => {
    const { getByText } = renderWithTheme(<WelcomeScreen />);
    fireEvent.press(getByText('Пропустить'));
    await waitFor(async () => {
      const v = await storage.get(StorageKeys.onboardingCompleted);
      expect(v).toBe('true');
    });
    expect(router.replace).toHaveBeenCalledWith('/(auth)/onboarding');
  });
});
```

- [ ] **Step 2: Implement**

```tsx
// app/(auth)/welcome.tsx
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { storage, StorageKeys } from '@/lib/storage';
import { useTheme } from '@/theme';

type Slide = { key: string; title: string; body: string; emoji: string };

const SLIDES: readonly Slide[] = [
  {
    key: '1',
    title: 'Тренировки на каждый день',
    body: 'Готовые программы и отдельные тренировки для дома и зала.',
    emoji: '💪',
  },
  {
    key: '2',
    title: 'Блог тренера',
    body: 'Разборы техники, советы по восстановлению, новости в твоём фиде.',
    emoji: '📝',
  },
  {
    key: '3',
    title: 'Твой прогресс остаётся с тобой',
    body: 'История тренировок, любимые программы, индивидуальный план — всё синхронизируется.',
    emoji: '📈',
  },
];

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const theme = useTheme();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await storage.set(StorageKeys.onboardingCompleted, 'true');
    router.replace('/(auth)/onboarding');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      void finish();
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <Screen>
      <View
        style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: theme.spacing.base }}
      >
        <Pressable onPress={() => void finish()} accessibilityRole="button">
          <Text variant="body" color="textMuted">
            Пропустить
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              paddingHorizontal: theme.spacing.lg,
              gap: theme.spacing.lg,
              justifyContent: 'center',
            }}
          >
            <Card variant="glass">
              <View style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'] }}>
                <Text variant="heroLg">{item.emoji}</Text>
              </View>
            </Card>
            <Text variant="hero" weight="bold" align="center">
              {item.title}
            </Text>
            <Text variant="bodyLg" color="textMuted" align="center">
              {item.body}
            </Text>
          </View>
        )}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.lg,
        }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? theme.colors.accent : theme.colors.divider,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <Button
          label={index === SLIDES.length - 1 ? 'Начать' : 'Дальше'}
          fullWidth
          onPress={next}
        />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests "app/(auth)/welcome.test.tsx"
git add "app/(auth)/welcome.tsx" "app/(auth)/welcome.test.tsx"
git commit -m "feat(auth): add 3-slide welcome onboarding"
```

---

### Task 24: Onboarding screen — remove mock

**Files:**

- Modify: `app/(auth)/onboarding.tsx`

- [ ] **Step 1: Replace contents**

```tsx
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function OnboardingScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View
        style={{ flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing['2xl'] }}
      >
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="hero" weight="bold">
            Fitness App
          </Text>
          <Text variant="bodyLg" color="textMuted">
            Тренировки, программы, блог тренера. Всё в одном месте.
          </Text>
        </View>

        <Card variant="glass">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="title" weight="semibold">
              Войди, чтобы продолжить
            </Text>
            <Text variant="body" color="textMuted">
              Email или номер телефона.
            </Text>
          </View>
        </Card>

        <View style={{ gap: theme.spacing.md }}>
          <Button label="Войти" fullWidth onPress={() => router.push('/(auth)/sign-in')} />
          <Button
            label="Создать аккаунт"
            variant="secondary"
            fullWidth
            onPress={() => router.push('/(auth)/sign-up')}
          />
        </View>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify typecheck + commit**

```bash
npm run typecheck
git add "app/(auth)/onboarding.tsx"
git commit -m "feat(auth): remove mock from onboarding choice screen"
```

---

### Task 25: Sign-in screen (Email + Phone via Segmented)

**Files:**

- Modify: `app/(auth)/sign-in.tsx`
- Create: `app/(auth)/sign-in.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// app/(auth)/sign-in.test.tsx
import { fireEvent, waitFor } from '@testing-library/react-native';

import * as signInWithEmailModule from '@/features/auth/api/signInWithEmail';
import * as signInWithPhoneModule from '@/features/auth/api/signInWithPhone';
import { renderWithTheme } from '@/test-utils/render';
import SignInScreen from './sign-in';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));
import { router } from 'expo-router';

describe('SignInScreen', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockReset();
    jest.restoreAllMocks();
  });

  it('по умолчанию показывает Email-форму', () => {
    const { getByText, queryByText } = renderWithTheme(<SignInScreen />);
    expect(getByText('Войти')).toBeTruthy();
    expect(queryByText('Получить код')).toBeNull();
  });

  it('вызывает signInWithEmail при отправке', async () => {
    const spy = jest
      .spyOn(signInWithEmailModule, 'signInWithEmail')
      .mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'pw12345678');
    fireEvent.press(getByText('Войти'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('a@b.c', 'pw12345678'));
  });

  it('показывает ошибку при провале', async () => {
    jest.spyOn(signInWithEmailModule, 'signInWithEmail').mockResolvedValueOnce({
      ok: false,
      error: 'Неверный email или пароль',
    });
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrong');
    fireEvent.press(getByText('Войти'));
    expect(await findByText('Неверный email или пароль')).toBeTruthy();
  });

  it('переключение на Телефон + отправка вызывает signInWithPhone и push на verify-otp', async () => {
    const spy = jest
      .spyOn(signInWithPhoneModule, 'signInWithPhone')
      .mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<SignInScreen />);
    fireEvent.press(getByText('Телефон'));
    fireEvent.changeText(getByPlaceholderText('+79991234567'), '+79991234567');
    fireEvent.press(getByText('Получить код'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('+79991234567'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(auth)/verify-otp',
      params: { phone: '+79991234567' },
    });
  });
});
```

- [ ] **Step 2: Run (FAIL)**

```bash
npm test -- --findRelatedTests "app/(auth)/sign-in.test.tsx"
```

- [ ] **Step 3: Implement**

```tsx
// app/(auth)/sign-in.tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Segmented, Text } from '@/components/ui';
import { signInWithEmail } from '@/features/auth/api/signInWithEmail';
import { signInWithPhone } from '@/features/auth/api/signInWithPhone';
import { useTheme } from '@/theme';

const MODES = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
] as const;
type Mode = (typeof MODES)[number]['value'];

export default function SignInScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async () => {
    setLoading(true);
    setError(null);
    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  const submitPhone = async () => {
    setLoading(true);
    setError(null);
    const res = await signInWithPhone(phone);
    setLoading(false);
    if (res.ok) {
      router.push({ pathname: '/(auth)/verify-otp', params: { phone } });
    } else {
      setError(res.error);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Вход
          </Text>
          <Text variant="body" color="textMuted">
            Войди по email или номеру телефона.
          </Text>
        </View>

        <Segmented
          value={mode}
          options={MODES}
          onChange={(v) => {
            setMode(v);
            setError(null);
          }}
        />

        {mode === 'email' ? (
          <>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Пароль"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {error ? (
              <Text variant="body" color="danger">
                {error}
              </Text>
            ) : null}
            <Button label="Войти" fullWidth loading={loading} onPress={() => void submitEmail()} />
            <Button
              label="Забыли пароль?"
              variant="ghost"
              fullWidth
              onPress={() => router.push('/(auth)/forgot-password')}
            />
          </>
        ) : (
          <>
            <Input
              label="Номер телефона"
              placeholder="+79991234567"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
            {error ? (
              <Text variant="body" color="danger">
                {error}
              </Text>
            ) : null}
            <Button
              label="Получить код"
              fullWidth
              loading={loading}
              onPress={() => void submitPhone()}
            />
          </>
        )}

        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Run + commit**

```bash
npm test -- --findRelatedTests "app/(auth)/sign-in.test.tsx"
git add "app/(auth)/sign-in.tsx" "app/(auth)/sign-in.test.tsx"
git commit -m "feat(auth): real sign-in screen with email + phone modes"
```

---

### Task 26: Sign-up screen

**Files:**

- Modify: `app/(auth)/sign-up.tsx`
- Create: `app/(auth)/sign-up.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { fireEvent, waitFor } from '@testing-library/react-native';

import * as signUpModule from '@/features/auth/api/signUpWithEmail';
import { renderWithTheme } from '@/test-utils/render';
import SignUpScreen from './sign-up';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

describe('SignUpScreen', () => {
  it('вызывает signUpWithEmail с email, password и displayName', async () => {
    const spy = jest.spyOn(signUpModule, 'signUpWithEmail').mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('не менее 8 символов'), 'pw12345678');
    fireEvent.changeText(getByPlaceholderText('Как тебя называть?'), 'Vadim');
    fireEvent.press(getByText('Создать аккаунт'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('a@b.c', 'pw12345678', 'Vadim'));
  });

  it('показывает ошибку', async () => {
    jest.spyOn(signUpModule, 'signUpWithEmail').mockResolvedValueOnce({
      ok: false,
      error: 'Аккаунт с таким email уже существует',
    });
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.changeText(getByPlaceholderText('не менее 8 символов'), 'pw12345678');
    fireEvent.press(getByText('Создать аккаунт'));
    expect(await findByText('Аккаунт с таким email уже существует')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { signUpWithEmail } from '@/features/auth/api/signUpWithEmail';
import { useTheme } from '@/theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await signUpWithEmail(email, password, name || undefined);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Регистрация
          </Text>
          <Text variant="body" color="textMuted">
            Создай аккаунт через email.
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Пароль"
          placeholder="не менее 8 символов"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Input
          label="Имя (необязательно)"
          placeholder="Как тебя называть?"
          value={name}
          onChangeText={setName}
        />

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Создать аккаунт" fullWidth loading={loading} onPress={() => void submit()} />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests "app/(auth)/sign-up.test.tsx"
git add "app/(auth)/sign-up.tsx" "app/(auth)/sign-up.test.tsx"
git commit -m "feat(auth): real sign-up screen with email"
```

---

### Task 27: Verify OTP screen

**Files:**

- Create: `app/(auth)/verify-otp.tsx`
- Create: `app/(auth)/verify-otp.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { fireEvent, waitFor } from '@testing-library/react-native';

import * as verifyModule from '@/features/auth/api/verifyPhoneOtp';
import * as resendModule from '@/features/auth/api/signInWithPhone';
import { renderWithTheme } from '@/test-utils/render';
import VerifyOtpScreen from './verify-otp';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ phone: '+79991234567' }),
}));

describe('VerifyOtpScreen', () => {
  it('вызывает verifyPhoneOtp с phone и кодом', async () => {
    const spy = jest.spyOn(verifyModule, 'verifyPhoneOtp').mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<VerifyOtpScreen />);
    fireEvent.changeText(getByPlaceholderText('123456'), '123456');
    fireEvent.press(getByText('Подтвердить'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('+79991234567', '123456'));
  });

  it('кнопка "Отправить ещё раз" вызывает signInWithPhone', async () => {
    const spy = jest.spyOn(resendModule, 'signInWithPhone').mockResolvedValueOnce({ ok: true });
    const { getByText } = renderWithTheme(<VerifyOtpScreen />);
    fireEvent.press(getByText(/Отправить ещё раз/));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('+79991234567'));
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { signInWithPhone } from '@/features/auth/api/signInWithPhone';
import { verifyPhoneOtp } from '@/features/auth/api/verifyPhoneOtp';
import { useTheme } from '@/theme';

const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone ?? '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await verifyPhoneOtp(phone, code);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  const resend = async () => {
    setError(null);
    const res = await signInWithPhone(phone);
    if (res.ok) setCooldown(RESEND_COOLDOWN);
    else setError(res.error);
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Введи код
          </Text>
          <Text variant="body" color="textMuted">
            SMS отправлено на {phone}.
          </Text>
        </View>

        <Input
          label="Код"
          placeholder="123456"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Подтвердить" fullWidth loading={loading} onPress={() => void submit()} />
        <Button
          label={cooldown > 0 ? `Отправить ещё раз (${cooldown}с)` : 'Отправить ещё раз'}
          variant="ghost"
          fullWidth
          disabled={cooldown > 0}
          onPress={() => void resend()}
        />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests "app/(auth)/verify-otp.test.tsx"
git add "app/(auth)/verify-otp.tsx" "app/(auth)/verify-otp.test.tsx"
git commit -m "feat(auth): add verify OTP screen with resend cooldown"
```

---

### Task 28: Forgot password screen

**Files:**

- Create: `app/(auth)/forgot-password.tsx`
- Create: `app/(auth)/forgot-password.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { fireEvent, waitFor } from '@testing-library/react-native';

import * as resetModule from '@/features/auth/api/resetPassword';
import { renderWithTheme } from '@/test-utils/render';
import ForgotPasswordScreen from './forgot-password';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

describe('ForgotPasswordScreen', () => {
  it('вызывает resetPassword и показывает экран подтверждения', async () => {
    const spy = jest.spyOn(resetModule, 'resetPassword').mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.c');
    fireEvent.press(getByText('Отправить ссылку'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('a@b.c'));
    expect(await findByText(/Письмо отправлено/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { resetPassword } from '@/features/auth/api/resetPassword';
import { useTheme } from '@/theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await resetPassword(email);
    setLoading(false);
    if (res.ok) setSent(true);
    else setError(res.error);
  };

  if (sent) {
    return (
      <Screen>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: theme.spacing.lg,
            padding: theme.spacing.lg,
          }}
        >
          <Text variant="hero" weight="bold" align="center">
            Письмо отправлено
          </Text>
          <Text variant="bodyLg" color="textMuted" align="center">
            Проверь {email}. Открой письмо и нажми на ссылку — приложение само откроется.
          </Text>
          <Button label="Готово" fullWidth onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Сброс пароля
          </Text>
          <Text variant="body" color="textMuted">
            Пришлём ссылку для смены пароля.
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label="Отправить ссылку"
          fullWidth
          loading={loading}
          onPress={() => void submit()}
        />
        <Button label="Назад" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests "app/(auth)/forgot-password.test.tsx"
git add "app/(auth)/forgot-password.tsx" "app/(auth)/forgot-password.test.tsx"
git commit -m "feat(auth): add forgot password screen"
```

---

### Task 29: Reset password screen (deep link)

**Files:**

- Create: `app/(auth)/reset-password.tsx`
- Create: `app/(auth)/reset-password.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { fireEvent, waitFor } from '@testing-library/react-native';

import * as updateModule from '@/features/auth/api/updatePassword';
import { renderWithTheme } from '@/test-utils/render';
import ResetPasswordScreen from './reset-password';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
import { router } from 'expo-router';

describe('ResetPasswordScreen', () => {
  beforeEach(() => (router.replace as jest.Mock).mockReset());

  it('требует совпадения пароля и подтверждения', async () => {
    const spy = jest.spyOn(updateModule, 'updatePassword');
    const { getByText, getByPlaceholderText, findByText } = renderWithTheme(
      <ResetPasswordScreen />,
    );
    fireEvent.changeText(getByPlaceholderText('Новый пароль'), 'pw12345678');
    fireEvent.changeText(getByPlaceholderText('Повтори пароль'), 'different');
    fireEvent.press(getByText('Сохранить'));
    expect(await findByText('Пароли не совпадают')).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('при совпадении вызывает updatePassword и redirect на tabs', async () => {
    const spy = jest.spyOn(updateModule, 'updatePassword').mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderWithTheme(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Новый пароль'), 'pw12345678');
    fireEvent.changeText(getByPlaceholderText('Повтори пароль'), 'pw12345678');
    fireEvent.press(getByText('Сохранить'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('pw12345678'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { updatePassword } from '@/features/auth/api/updatePassword';
import { useTheme } from '@/theme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    const res = await updatePassword(password);
    setLoading(false);
    if (res.ok) {
      router.replace('/(tabs)/home');
    } else {
      setError(res.error);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="hero" weight="bold">
            Новый пароль
          </Text>
          <Text variant="body" color="textMuted">
            Минимум 8 символов.
          </Text>
        </View>

        <Input
          label="Пароль"
          placeholder="Новый пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Input
          label="Подтверждение"
          placeholder="Повтори пароль"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Сохранить" fullWidth loading={loading} onPress={() => void submit()} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- --findRelatedTests "app/(auth)/reset-password.test.tsx"
git add "app/(auth)/reset-password.tsx" "app/(auth)/reset-password.test.tsx"
git commit -m "feat(auth): add reset password screen for deep link"
```

---

### Task 30: Profile tab — show user data + sign out

**Files:**

- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Read current profile screen**

```bash
cat "app/(tabs)/profile.tsx"
```

Note current structure to preserve layout.

- [ ] **Step 2: Replace contents**

```tsx
import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const email = useAuthStore((s) => s.user?.email);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: profile } = useProfile();

  return (
    <Screen scroll padded>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing['2xl'] }}>
        <Text variant="hero" weight="bold">
          Профиль
        </Text>

        <Card variant="glass">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="caption" color="textMuted">
              Имя
            </Text>
            <Text variant="bodyLg" weight="medium">
              {profile?.display_name ?? '—'}
            </Text>
            <Text variant="caption" color="textMuted">
              Email
            </Text>
            <Text variant="bodyLg">{email ?? '—'}</Text>
          </View>
        </Card>

        <Button label="Выйти" variant="secondary" fullWidth onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/profile.tsx"
git commit -m "feat(auth): wire profile tab to Supabase user + signOut"
```

---

## Phase 7: Documentation

### Task 31: Update CLAUDE.md and design-system.md

**Files:**

- Modify: `CLAUDE.md`
- Modify: `docs/design-system.md`

- [ ] **Step 1: Update CLAUDE.md auth section**

Find the line referencing Supabase Auth in stack section. Replace any mock-related notes (if present from Iter 0). Add note under existing structure:

```
**Auth (Iter 1):** Supabase Auth — email/password + phone OTP. Apple/Google Sign-In deferred until dev build.
Session persisted in AsyncStorage. `useAuthStore.hydrate()` runs once at app start, subscribes to `onAuthStateChange`.
API functions in `src/features/auth/api/*` are the single entrypoint to `supabase.auth.*` calls.
```

(Place under the "Stack" or "Architecture Rules" section as appropriate — read existing file first to choose the right spot.)

- [ ] **Step 2: Update docs/design-system.md**

In the Components table, add a row:

```
| `Segmented` | Tab-style selector. Props: `value`, `options`, `onChange`. Used for Email/Phone toggle in sign-in. |
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/design-system.md
git commit -m "docs: update CLAUDE.md and design-system for Supabase auth + Segmented"
```

---

## Phase 8: Verification

### Task 32: Run full quality gate

- [ ] **Step 1: Typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: 0 errors/warnings.

- [ ] **Step 3: Full test suite**

```bash
npm test
```

Expected: all tests pass. Should be ~38–43 tests total (13 from Iter 0 + ~25–30 new).

- [ ] **Step 4: Verify Supabase advisors clean**

Call:

```
mcp__supabase__get_advisors(project_id="kmvkahweelgsjlzawuyy", type="security")
```

Expected: 0 errors related to `profiles`.

---

### Task 33: Manual E2E in Expo Go

**No code.** User runs through verification scenarios in spec.

- [ ] **Step 1: Start dev server**

```bash
npm start
```

Then `i` for iOS simulator (or scan QR on device).

- [ ] **Step 2: Scenario A — Welcome + Email signup**

Per spec section "Сценарий A". Confirm steps 8–14.

- [ ] **Step 3: Scenario B — Phone OTP**

Per spec "Сценарий B". Use `+79991234567` → `123456`.

- [ ] **Step 4: Scenario C — Password reset**

Per spec "Сценарий C". Real email required for verification.

- [ ] **Step 5: Scenario D — Errors**

Per spec "Сценарий D". Confirm error messages localized.

- [ ] **Step 6: Scenario E — Session persistence**

Per spec "Сценарий E". Cold restart → straight to tabs.

- [ ] **Step 7: Pre-commit hook smoke test**

Make a trivial whitespace change to any file, `git add`, `git commit -m "test: pre-commit"`.
Expected: lint + typecheck run, commit succeeds.

```bash
git reset --soft HEAD~1
git restore --staged <changed-file>
git checkout -- <changed-file>
```

(rollback the trivial commit)

---

## Self-Review Notes

**Spec coverage (each spec section → task):**

- Supabase deps + env → Task 1, 2
- Migration → Task 3
- DB types → Task 4
- Dashboard config → Task 5
- Supabase client → Task 6
- jest setup → Task 7
- Storage key → Task 8
- mapAuthError → Task 9
- Each api function → Tasks 10–16
- API barrel → Task 17
- Auth store → Task 18
- useProfile / useUpdateProfile → Tasks 19, 20
- Segmented → Task 21
- AuthGate / index logic → Task 22
- Welcome screen → Task 23
- Onboarding screen → Task 24
- Sign-in screen → Task 25
- Sign-up screen → Task 26
- Verify OTP screen → Task 27
- Forgot password → Task 28
- Reset password → Task 29
- Profile tab → Task 30
- Docs → Task 31
- Verification → Tasks 32, 33

**Type/method consistency:** `AuthResult`, `AuthStatus`, `Profile`, `ProfileUpdate` defined once and referenced consistently. `signInWithEmail(email, password)` signature matches between api, test, and screen call sites. `signOutApi` import alias used in store to avoid name clash with store's `signOut` method.

**No placeholders.** Each step has actual code or exact command.

---

## Final Notes

- Tasks 10–16 follow identical TDD pattern but are independent — they can be parallelized across subagents.
- Task 5 (Supabase Dashboard config) is manual; the rest is fully scriptable.
- Task 33 (manual E2E) requires the user — agent should pause and ask user to run scenarios.
- Total expected new tests: ~25–30. Total commits: ~30. Branch: stay on `master` (single dev) or create `feat/iteration-1-auth` if user prefers PR flow.
