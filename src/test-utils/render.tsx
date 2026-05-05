import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider, type ThemeMode } from '@/theme';

export function renderWithTheme(
  ui: ReactElement,
  options?: RenderOptions & { themeMode?: ThemeMode },
) {
  const { themeMode = 'dark', ...rest } = options ?? {};
  return render(<ThemeProvider forcedMode={themeMode}>{ui}</ThemeProvider>, rest);
}
