import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme, type RadiusToken } from '@/theme';

export type CardVariant = 'base' | 'glass';

export type CardProps = ViewProps & {
  variant?: CardVariant;
  radius?: RadiusToken;
  padded?: boolean;
};

export function Card({
  variant = 'base',
  radius = 'lg',
  padded = true,
  children,
  style,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const padding = padded ? theme.spacing.base : 0;

  const wrapperStyle: ViewStyle = {
    borderRadius: theme.radii[radius],
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  };

  if (variant === 'glass') {
    return (
      <View
        style={[
          wrapperStyle,
          {
            borderColor: theme.colors.glassBorder,
            backgroundColor: theme.colors.glassBg,
          },
          style,
        ]}
        {...rest}
      >
        <BlurView
          intensity={theme.blur.regular}
          tint={theme.mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ padding }}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        wrapperStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.divider,
          padding,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
