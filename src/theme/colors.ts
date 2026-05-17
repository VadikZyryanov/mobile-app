export const palette = {
  // Knyazeva Team brand palette (D2)
  ink: '#0A0910',
  graphite: '#15121B',
  graphite2: '#1D1925',
  cream: '#EFE6D4',
  beige: '#D8C8A6',
  beigeSoft: 'rgba(232,220,196,0.6)',
  pink: '#FF2D87',
  pinkSoft: '#FF7AB0',
  success: '#7FD6A4',
  danger: '#FF5470',
  white: '#FFFFFF',
  black: '#000000',
  // Legacy tokens (removed in D7).
  blue: '#2563EB',
  blueAlt: '#3B82F6',
  gray100: '#F5F5F7',
  gray400: '#6B7280',
  gray700: '#1F2937',
  gray900: '#111827',
  red: '#FF5470',
  green: '#7FD6A4',
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
  bg: palette.ink,
  bgElevated: palette.graphite,
  surface: palette.graphite2,
  glassBg: 'rgba(232,220,196,0.07)',
  glassBorder: 'rgba(232,220,196,0.12)',
  text: palette.cream,
  textMuted: palette.beigeSoft,
  accent: palette.pink,
  divider: 'rgba(232,220,196,0.07)',
  danger: palette.danger,
  success: palette.success,
};

// Light theme temporarily mirrors dark; removed in D7 when force-dark lands.
export const lightColors: SemanticColors = { ...darkColors };
