import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { FontWeightToken, TypographyVariant } from '@/theme';

export type TextColor = 'text' | 'textMuted' | 'accent' | 'danger' | 'success' | 'inverse';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  weight?: FontWeightToken;
  color?: TextColor;
  align?: TextStyle['textAlign'];
};

export function Text({
  variant = 'body',
  weight,
  color = 'text',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const sized = theme.typography[variant];

  const colorValue: string =
    color === 'text'
      ? theme.colors.text
      : color === 'textMuted'
        ? theme.colors.textMuted
        : color === 'accent'
          ? theme.colors.accent
          : color === 'danger'
            ? theme.colors.danger
            : color === 'success'
              ? theme.colors.success
              : theme.colors.text;

  const composed: TextStyle = {
    ...sized,
    color: colorValue,
    fontFamily: theme.fontFamily[theme.variantFamily[variant]],
    ...(weight ? { fontWeight: theme.fontWeight[weight] } : {}),
    textAlign: align,
  };

  return <RNText style={[composed, style]} {...rest} />;
}
