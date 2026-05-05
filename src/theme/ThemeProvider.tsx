import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { blur } from './blur';
import { darkColors, lightColors, palette, type SemanticColors } from './colors';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamily, fontWeight, typography } from './typography';

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  colors: SemanticColors;
  palette: typeof palette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  fontWeight: typeof fontWeight;
  shadows: typeof shadows;
  blur: typeof blur;
};

const buildTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: mode === 'dark' ? darkColors : lightColors,
  palette,
  spacing,
  radii,
  typography,
  fontFamily,
  fontWeight,
  shadows,
  blur,
});

export const ThemeContext = createContext<Theme>(buildTheme('dark'));

type Props = {
  children: ReactNode;
  forcedMode?: ThemeMode;
};

export function ThemeProvider({ children, forcedMode }: Props) {
  const systemScheme = useColorScheme();
  const mode: ThemeMode = forcedMode ?? (systemScheme === 'light' ? 'light' : 'dark');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
