import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export type FABVariant = 'pink' | 'surface';

export type FABProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: FABVariant;
  size?: number;
  children: ReactNode;
};

export function FAB({
  variant = 'pink',
  size = 56,
  disabled = false,
  children,
  ...rest
}: FABProps) {
  const theme = useTheme();

  const backgroundColor = variant === 'pink' ? theme.colors.accent : theme.colors.bgElevated;

  const style: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    shadowColor: theme.colors.accent,
    shadowOpacity: variant === 'pink' ? 0.4 : 0,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: variant === 'pink' ? 6 : 0,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={style} {...rest}>
      {children}
    </Pressable>
  );
}
