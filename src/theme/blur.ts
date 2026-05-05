export const blur = {
  light: 20,
  regular: 40,
  strong: 80,
} as const;

export type BlurToken = keyof typeof blur;
