import { isValidElement, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { IconButton, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export type TopBarLeading = 'back' | 'close' | ReactNode;

export type TopBarProps = Omit<ViewProps, 'children'> & {
  title?: string;
  leading?: TopBarLeading;
  onLeadingPress?: () => void;
  right?: ReactNode;
  centered?: boolean;
};

const ICON_SIZE = 20;

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TopBar({
  title,
  leading,
  onLeadingPress,
  right,
  centered = false,
  style,
  ...rest
}: TopBarProps) {
  const theme = useTheme();

  const renderLeading = (): ReactNode => {
    if (!leading) return null;
    if (leading === 'back' || leading === 'close') {
      return (
        <IconButton
          variant="ghost"
          size={38}
          onPress={onLeadingPress}
          accessibilityLabel={leading === 'back' ? 'Назад' : 'Закрыть'}
        >
          {leading === 'back' ? (
            <BackIcon color={theme.colors.text} />
          ) : (
            <CloseIcon color={theme.colors.text} />
          )}
        </IconButton>
      );
    }
    if (isValidElement(leading)) return leading;
    return null;
  };

  return (
    <View
      style={[
        {
          minHeight: 56,
          paddingHorizontal: theme.spacing.base,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
        },
        style,
      ]}
      {...rest}
    >
      <View style={{ width: 38, alignItems: 'flex-start' }}>{renderLeading()}</View>

      <View
        style={{
          flex: 1,
          alignItems: centered ? 'center' : 'flex-start',
        }}
      >
        {title ? (
          <Text variant="h3" weight="bold" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      <View style={{ minWidth: 38, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
