import { View, type ViewProps, type ViewStyle } from 'react-native';

import { palette, useTheme } from '@/theme';
import { Text, type TextColor } from '../Text';

export type BadgeVariant = 'default' | 'pink' | 'beige' | 'dot' | 'pro' | 'live';

export type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  label?: string;
};

export function Badge({ variant = 'default', label, style, ...rest }: BadgeProps) {
  const theme = useTheme();

  if (variant === 'dot') {
    return (
      <View
        accessibilityRole="image"
        style={[
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.colors.accent,
          },
          style,
        ]}
        {...rest}
      />
    );
  }

  const backgroundColor: string =
    variant === 'pink' || variant === 'pro'
      ? theme.colors.accent
      : variant === 'beige'
        ? palette.beige
        : variant === 'live'
          ? theme.colors.danger
          : theme.colors.bgElevated;

  const labelColor: TextColor =
    variant === 'pink' || variant === 'pro' || variant === 'live'
      ? 'onAccent'
      : variant === 'beige'
        ? 'ink'
        : 'textMuted';

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor,
  };

  return (
    <View style={[containerStyle, style]} {...rest}>
      {variant === 'live' ? (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.colors.onAccent,
          }}
        />
      ) : null}
      <Text variant="label" color={labelColor} family="mono">
        {label ?? (variant === 'pro' ? 'PRO' : variant === 'live' ? 'LIVE' : '')}
      </Text>
    </View>
  );
}
