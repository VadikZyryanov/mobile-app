# Design System (Iteration 0)

Glassmorphism design system for the Fitness App. Tokens live in `src/theme/`, components in `src/components/ui/`.

## Tokens

### Colors

Two themes (`light`, `dark`) with auto-switch based on `useColorScheme()`. Choose tokens semantically, never reference `palette.*` directly in components.

| Token               | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `bg`                | Screen background                         |
| `bgElevated`        | Cards/inputs in `base` variant            |
| `surface`           | Solid surface (modals)                    |
| `glassBg`           | Translucent layer for glass cards/tab-bar |
| `glassBorder`       | 1px hairline on glass surfaces            |
| `text`              | Primary text                              |
| `textMuted`         | Secondary text, captions                  |
| `accent`            | Brand blue `#2563EB`                      |
| `divider`           | Hairline separators                       |
| `danger`, `success` | State colors                              |

V2 option: warm accent (e.g. `#EAB308`) — referenced in TZ inspiration set.

### Spacing

`xs:4, sm:8, md:12, base:16, lg:20, xl:24, 2xl:32, 3xl:40`

### Radii

`sm:8, md:12, lg:16, xl:20, 2xl:24, full:9999`

### Typography

System font, 7 variants:
`caption(12), body(14), bodyLg(16), title(20), titleLg(24), hero(32), heroLg(40)`
Weights: `regular(400), medium(500), semibold(600), bold(700)`

### Blur (intensity for `expo-blur`)

`light:20, regular:40, strong:80`

### Shadows

`none, sm, md, lg`

## Components

| Component | Notes                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------- |
| `Text`    | Always use this instead of RN `Text`. Props: `variant`, `weight`, `color`, `align`.             |
| `Screen`  | SafeArea wrapper. Props: `scroll`, `padded`, `edges`.                                           |
| `Card`    | Variants: `base`, `glass`. Glass uses `BlurView` + `glassBg`.                                   |
| `Input`   | Floating label, focused state highlights with accent border. Supports `label`, `error`, `hint`. |
| `Button`  | Variants: `primary`, `secondary`, `ghost`. Sizes: `sm`, `md`, `lg`. Press-scale via Reanimated. |

## Usage

```tsx
import { Button, Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

function Example() {
  const theme = useTheme();
  return (
    <Screen scroll>
      <Text variant="hero" weight="bold">
        Hello
      </Text>
      <Card variant="glass">
        <Text>Glass card</Text>
      </Card>
      <Button label="Tap" onPress={() => {}} />
    </Screen>
  );
}
```

## What this iteration does NOT include

- `shared/` composed components (ExerciseCard, BlogPostCard, SubscriptionCard) — added in iterations 1+ when consumers exist
- Production icon/splash animation — separate design track
- Light theme override (toggle in app, ignoring system) — when needed

## Storage

`src/lib/storage.ts` wraps `@react-native-async-storage/async-storage` (Expo Go compatible). Async API: `get/set/remove/clearAll/getAllKeys`. Keys are typed via `StorageKeys`. Swap to MMKV later when project moves to a dev build.
