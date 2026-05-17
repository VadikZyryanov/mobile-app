import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from '../Text';

export type NotificationVariant = 'success' | 'error';

export type NotificationProps = ViewProps & {
  variant: NotificationVariant;
  message: string;
  title?: string;
};

const TINT_BG: Record<NotificationVariant, string> = {
  success: 'rgba(127,214,164,0.12)',
  error: 'rgba(255,84,112,0.12)',
};

export function Notification({ variant, message, title, style, ...rest }: NotificationProps) {
  const theme = useTheme();
  const accent = variant === 'success' ? theme.colors.success : theme.colors.danger;

  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          flexDirection: 'row',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: theme.radii.md,
          backgroundColor: TINT_BG[variant],
          borderLeftWidth: 4,
          borderLeftColor: accent,
        },
        style,
      ]}
      {...rest}
    >
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <Text variant="body" weight="bold">
            {title}
          </Text>
        ) : null}
        <Text variant="small" color={title ? 'textMuted' : 'text'}>
          {message}
        </Text>
      </View>
    </View>
  );
}
