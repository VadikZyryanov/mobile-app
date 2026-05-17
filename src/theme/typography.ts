import { type TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Manrope_800ExtraBold',
  bold: 'Manrope_700Bold',
  body: 'Manrope_400Regular',
  mono: 'JetBrainsMono_600SemiBold',
} as const;

export type FontFamilyToken = keyof typeof fontFamily;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export type FontWeightToken = keyof typeof fontWeight;

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'small'
  | 'label'
  | 'statBig'
  // Legacy aliases (removed in D7).
  | 'caption'
  | 'bodyLg'
  | 'title'
  | 'titleLg'
  | 'hero'
  | 'heroLg';

type VariantStyle = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight' | 'textTransform'
>;

const baseVariants = {
  display: { fontSize: 34, lineHeight: 36, letterSpacing: -0.85, fontWeight: '800' },
  h1: { fontSize: 28, lineHeight: 32, letterSpacing: -0.56, fontWeight: '800' },
  h2: { fontSize: 20, lineHeight: 26, letterSpacing: -0.3, fontWeight: '800' },
  h3: { fontSize: 15, lineHeight: 20, letterSpacing: -0.15, fontWeight: '700' },
  h4: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  small: { fontSize: 11, lineHeight: 15, fontWeight: '400' },
  label: {
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 1.3,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statBig: { fontSize: 26, lineHeight: 30, fontWeight: '600' },
} as const satisfies Record<string, VariantStyle>;

export const typography: Record<TypographyVariant, VariantStyle> = {
  ...baseVariants,
  // Legacy aliases kept until D7 to avoid touching every consumer in D2.
  hero: baseVariants.display,
  heroLg: baseVariants.display,
  title: baseVariants.h2,
  titleLg: baseVariants.h1,
  bodyLg: baseVariants.h3,
  caption: baseVariants.small,
};

// Variant → font family. Used by Text component (D2). The `family` prop
// override is added in D3a; until then this map drives the default.
export const variantFamily: Record<TypographyVariant, FontFamilyToken> = {
  display: 'display',
  h1: 'display',
  h2: 'display',
  h3: 'bold',
  h4: 'bold',
  body: 'body',
  small: 'body',
  label: 'body',
  statBig: 'mono',
  hero: 'display',
  heroLg: 'display',
  title: 'display',
  titleLg: 'display',
  bodyLg: 'bold',
  caption: 'body',
};
