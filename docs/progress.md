# Roadmap & Progress

| #   | Итерация              | Статус     | Дата завершения |
| --- | --------------------- | ---------- | --------------- |
| 0   | Фундамент             | ✅ Done    | 2026-05-05      |
| 1   | Auth + Supabase       | ⬜ Planned |                 |
| 2   | Backend MVP + контент | ⬜ Planned |                 |
| 3   | Подписки (RevenueCat) | ⬜ Planned |                 |
| 4   | Push + офлайн         | ⬜ Planned |                 |
| 5   | Pro Max: питание      | ⬜ Planned |                 |
| 6   | Админ-SPA             | ⬜ Planned |                 |

## Текущая итерация

**Итерация 1** — Auth + Supabase  
Спека: `docs/superpowers/specs/2026-05-05-iteration-1-auth-design.md`  
План: `docs/superpowers/plans/2026-05-05-iteration-1-auth.md`

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
