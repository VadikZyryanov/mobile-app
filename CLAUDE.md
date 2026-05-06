# Fitness App — Claude Context

## Stack

**Frontend:** React Native + Expo (Expo Router)  
**Backend:** Node.js + Express  
**DB:** PostgreSQL (primary) + Redis (cache/sessions)  
**Auth:** Supabase Auth (email, Apple Sign-In, Google Sign-In)  
**Payments:** RevenueCat → App Store IAP / Google Play IAP  
**Push:** Expo Notifications + Firebase Cloud Messaging  
**Media:** AWS S3 + CloudFront CDN  
**Video:** Mux or Cloudflare Stream  
**Offline/Cache:** React Query + AsyncStorage + expo-file-system (MMKV — для V2, когда переедем на dev build)  
**Tests:** Jest + React Native Testing Library  
**Tooling:** ESBuild, TypeScript strict, ESLint, Prettier, Husky, lint-staged

## Project Structure

```
src/
├── app/              # Expo Router — navigation
├── components/
│   ├── ui/           # Atomic: Button, Input, Card, Badge, Avatar...
│   └── shared/       # Composed: ExerciseCard, SubscriptionCard...
├── features/         # Feature-sliced modules
├── hooks/
├── services/         # API clients
├── store/            # Zustand
├── theme/            # Design system: colors, typography, spacing
└── utils/
```

Backend modules: `auth`, `users`, `workouts`, `blog`, `subscriptions`, `notifications`, `nutrition`, `admin`

## Design System

- **Style:** Glassmorphism
- **Colors:** Black `#0A0A0A`, Blue `#2563EB`, Gray `#6B7280`, White `#FAFAFA`
- **Animations:** Reanimated 3 — smooth transitions, micro-animations
- **Safe areas:** support modern iPhone + Android models
- **Component approach:** atomic, all base UI elements reusable

## Subscription Tiers

| Tier    | Access                             |
| ------- | ---------------------------------- |
| Free    | Exercise technique preview only    |
| Basic   | Free + ready-made workout programs |
| Pro     | Basic + individual training plan   |
| Pro Max | Pro + nutrition tracking           |

Payments via RevenueCat. Handle: upgrade, downgrade, cancel, restore, grace period.

## Key Features

**Workouts:** Categories (All, Upper, Lower, Full Body, Programs). Exercise card includes name, technique description, GIF preview, video (cached after first view), subscription gate.

**Blog:** Trainer posts, card feed, detail page. Push on new post.

**Offline:** Videos cached via `expo-file-system` after first view. Workout data cached via React Query + MMKV. Show offline availability indicator.

**Push triggers:** new blog post, subscription expiring in 3/1 day, subscription renewed/failed, new individual plan ready.

**Admin (separate Web SPA — React + Vite):** Users list filtered by tier, dashboard (MRR, new subs, churn), content management (exercises/workouts/blog), manual subscription override, push to user segments.

## Architecture Rules

- TypeScript strict mode — no `any`, use `unknown` + type guards
- All navigation via Expo Router (`app/` directory)
- State management: Zustand for global state, React Query for server state
- API clients live in `services/`, never call fetch directly from components
- Feature logic in `features/` (feature-sliced), not in components
- Pre-commit: Husky + lint-staged runs ESLint + Prettier + tsc

## Scalability (design for now)

DB and API must support future additions without refactoring:

- Apple Health / Google Fit / Garmin sync
- Extended nutrition tracking (partially in Pro Max already)
- New content types

## Commands

```bash
# Install
npm install

# Run
npm start          # Expo dev server
npm ios            # iOS simulator
npm android        # Android emulator

# Quality
npm lint           # ESLint
npm typecheck      # tsc --noEmit
npm test           # Jest
npm test --coverage

# Build
npm build          # ESBuild production
```

## Additional Context

@docs/progress.md # Текущий статус итераций и что уже реализовано
@docs/architecture.md # DB schema and API architecture details
@docs/api-standards.md # REST conventions, error formats, auth headers
@docs/design-system.md # Component usage rules, glassmorphism specs
