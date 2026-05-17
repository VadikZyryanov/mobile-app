import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette, useTheme } from '@/theme';
import { Text, type TextColor } from '../Text';
import type { TypographyVariant } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'cream' | 'text';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  label: string;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const sizeMap: Record<
  ButtonSize,
  { paddingV: number; paddingH: number; textVariant: TypographyVariant; gap: number }
> = {
  xs: { paddingV: 6, paddingH: 12, textVariant: 'small', gap: 6 },
  sm: { paddingV: 8, paddingH: 14, textVariant: 'body', gap: 8 },
  md: { paddingV: 12, paddingH: 18, textVariant: 'bodyLg', gap: 8 },
  lg: { paddingV: 16, paddingH: 24, textVariant: 'bodyLg', gap: 10 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  label,
  fullWidth = false,
  iconLeft,
  iconRight,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  const variantStyles = (() => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.accent,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.bgElevated,
          borderColor: theme.colors.divider,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'cream':
        return {
          backgroundColor: palette.cream,
          borderColor: palette.cream,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
    }
  })();

  const labelColor: TextColor = (() => {
    switch (variant) {
      case 'primary':
        return 'onAccent';
      case 'ghost':
      case 'text':
        return 'accent';
      case 'cream':
        return 'ink';
      case 'secondary':
      default:
        return 'text';
    }
  })();

  const spinnerColor =
    variant === 'primary'
      ? theme.colors.onAccent
      : variant === 'cream'
        ? palette.ink
        : theme.colors.accent;

  const containerStyle: ViewStyle = {
    paddingVertical: sizeMap[size].paddingV,
    paddingHorizontal: sizeMap[size].paddingH,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: sizeMap[size].gap,
    opacity: isDisabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    ...variantStyles,
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={[containerStyle, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withTiming(0.97, { duration: 80 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 120 });
        onPressOut?.(e);
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {iconLeft ? <View>{iconLeft}</View> : null}
          <Text variant={sizeMap[size].textVariant} weight="semibold" color={labelColor}>
            {label}
          </Text>
          {iconRight ? <View>{iconRight}</View> : null}
        </>
      )}
    </AnimatedPressable>
  );
}
