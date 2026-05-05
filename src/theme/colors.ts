export const palette = {
  blue: '#2563EB',
  blueAlt: '#3B82F6',
  black: '#0A0A0A',
  white: '#FAFAFA',
  gray100: '#F5F5F7',
  gray400: '#6B7280',
  gray700: '#1F2937',
  gray900: '#111827',
  red: '#EF4444',
  green: '#22C55E',
} as const;

export type SemanticColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  glassBg: string;
  glassBorder: string;
  text: string;
  textMuted: string;
  accent: string;
  divider: string;
  danger: string;
  success: string;
};

export const darkColors: SemanticColors = {
  bg: palette.black,
  bgElevated: palette.gray900,
  surface: palette.gray900,
  glassBg: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  text: palette.white,
  textMuted: palette.gray400,
  accent: palette.blue,
  divider: 'rgba(255,255,255,0.08)',
  danger: palette.red,
  success: palette.green,
};

export const lightColors: SemanticColors = {
  bg: palette.white,
  bgElevated: palette.gray100,
  surface: '#FFFFFF',
  glassBg: 'rgba(10,10,10,0.06)',
  glassBorder: 'rgba(10,10,10,0.10)',
  text: palette.black,
  textMuted: palette.gray400,
  accent: palette.blue,
  divider: 'rgba(10,10,10,0.06)',
  danger: palette.red,
  success: palette.green,
};
