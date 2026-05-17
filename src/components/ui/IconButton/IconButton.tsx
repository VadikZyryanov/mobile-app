import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { palette, useTheme } from '@/theme';

export type IconButtonVariant = 'ghost' | 'pink' | 'cream';

export type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: IconButtonVariant;
  size?: number;
  children: ReactNode;
};

export function IconButton({
  variant = 'ghost',
  size = 42,
  disabled = false,
  children,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'pink'
      ? theme.colors.accent
      : variant === 'cream'
        ? palette.cream
        : theme.colors.glassBg;

  const borderColor =
    variant === 'pink'
      ? theme.colors.accent
      : variant === 'cream'
        ? palette.cream
        : theme.colors.glassBorder;

  const style: ViewStyle = {
    width: size,
    height: size,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    borderColor,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={style} {...rest}>
      {children}
    </Pressable>
  );
}
