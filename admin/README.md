# Fitness Admin SPA

Веб-админка для управления пользователями, подписками и контентом мобильного приложения. React + Vite + TypeScript + Tailwind + shadcn/ui.

## Запуск

```bash
# из корня монорепо
npm run admin:install
cp admin/.env.example admin/.env
# заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run admin:dev
```

Открыть `http://localhost:5173`.

## Скрипты

| Корневой скрипт           | Что делает                        |
| ------------------------- | --------------------------------- |
| `npm run admin:install`   | Установить зависимости в `admin/` |
| `npm run admin:dev`       | Vite dev-сервер                   |
| `npm run admin:build`     | Сборка `admin/dist`               |
| `npm run admin:preview`   | Превью продакшн-сборки            |
| `npm run admin:lint`      | ESLint                            |
| `npm run admin:typecheck` | `tsc --noEmit`                    |
| `npm run admin:test`      | Vitest                            |

## Доступ

В Admin SPA пускают только пользователей с `profiles.is_admin = true`. Для назначения админа выполнить в Supabase Studio:

```sql
update public.profiles
   set is_admin = true
 where id = (select id from auth.users where email = '<email>');
```

## Scope (Iter 6a)

- Login через Supabase Auth + проверка `is_admin`
- Список пользователей с фильтром по tier и поиском
- Ручной override подписки (RPC `admin_override_subscription`) с записью в `admin_audit_log`

Не входит: CRUD контента (6b), Dashboard метрики (6c), Push.
