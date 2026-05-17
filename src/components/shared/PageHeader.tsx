import { View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

export type PageHeaderProps = Omit<ViewProps, 'children'> & {
  title: string;
  subLabel?: string;
};

export function PageHeader({ title, subLabel, style, ...rest }: PageHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          paddingHorizontal: theme.spacing.base,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          gap: theme.spacing.xs,
        },
        style,
      ]}
      {...rest}
    >
      {subLabel ? (
        <Text variant="label" family="mono" color="textMuted">
          {subLabel}
        </Text>
      ) : null}
      <Text variant="display" weight="bold">
        {title}
      </Text>
    </View>
  );
}
