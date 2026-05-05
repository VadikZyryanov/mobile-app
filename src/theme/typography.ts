import { Platform, type TextStyle } from 'react-native';

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export type FontWeightToken = keyof typeof fontWeight;

export type TypographyVariant =
  | 'caption'
  | 'body'
  | 'bodyLg'
  | 'title'
  | 'titleLg'
  | 'hero'
  | 'heroLg';

export const typography: Record<
  TypographyVariant,
  Pick<TextStyle, 'fontSize' | 'lineHeight' | 'letterSpacing'>
> = {
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  body: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  bodyLg: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  title: { fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  titleLg: { fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
  hero: { fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  heroLg: { fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
};
