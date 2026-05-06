import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from '../Text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.md,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.divider,
  };

  return (
    <View style={containerStyle}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              alignItems: 'center',
              borderRadius: theme.radii.sm,
              backgroundColor: selected ? theme.colors.surface : 'transparent',
            }}
          >
            <Text
              variant="body"
              weight={selected ? 'semibold' : 'regular'}
              color={selected ? 'text' : 'textMuted'}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
