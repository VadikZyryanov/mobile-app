import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from '../Text';

export type CheckboxShape = 'square' | 'round';

export type CheckboxProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  shape?: CheckboxShape;
  size?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Checkbox({
  value,
  onValueChange,
  shape = 'square',
  size = 22,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps) {
  const theme = useTheme();

  const radius = shape === 'round' ? size / 2 : theme.radii.sm;

  const boxStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth: value ? 0 : StyleSheet.hairlineWidth,
    borderColor: theme.colors.glassBorder,
    backgroundColor: value ? theme.colors.accent : theme.colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
    >
      <View style={boxStyle}>
        {value ? (
          <Text variant="small" weight="bold" color="onAccent">
            ✓
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
