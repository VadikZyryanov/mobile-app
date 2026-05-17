import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme';
import { Text, type TextColor } from '../Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  label: string;
  fullWidth?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const sizeMap: Record<
  ButtonSize,
  { paddingV: number; paddingH: number; textVariant: 'body' | 'bodyLg' }
> = {
  sm: { paddingV: 8, paddingH: 14, textVariant: 'body' },
  md: { paddingV: 12, paddingH: 18, textVariant: 'bodyLg' },
  lg: { paddingV: 16, paddingH: 24, textVariant: 'bodyLg' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  label,
  fullWidth = false,
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
    }
  })();

  const labelColor: TextColor =
    variant === 'primary' ? 'inverse' : variant === 'ghost' ? 'accent' : 'text';

  const containerStyle: ViewStyle = {
    paddingVertical: sizeMap[size].paddingV,
    paddingHorizontal: sizeMap[size].paddingH,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.text : theme.colors.accent}
        />
      ) : (
        <View>
          <Text variant={sizeMap[size].textVariant} weight="semibold" color={labelColor}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
