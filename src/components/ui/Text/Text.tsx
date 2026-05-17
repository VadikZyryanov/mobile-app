import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { palette, useTheme } from '@/theme';
import type { FontFamilyToken, FontWeightToken, TypographyVariant } from '@/theme';

export type TextColor =
  | 'text'
  | 'textMuted'
  | 'accent'
  | 'danger'
  | 'success'
  | 'inverse'
  | 'onAccent'
  | 'ink';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  weight?: FontWeightToken;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  family?: FontFamilyToken;
};

export function Text({
  variant = 'body',
  weight,
  color = 'text',
  align,
  family,
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
              : color === 'onAccent'
                ? theme.colors.onAccent
                : color === 'ink'
                  ? palette.ink
                  : theme.colors.text;

  const familyToken: FontFamilyToken = family ?? theme.variantFamily[variant];

  const composed: TextStyle = {
    ...sized,
    color: colorValue,
    fontFamily: theme.fontFamily[familyToken],
    ...(weight ? { fontWeight: theme.fontWeight[weight] } : {}),
    textAlign: align,
  };

  return <RNText style={[composed, style]} {...rest} />;
}
