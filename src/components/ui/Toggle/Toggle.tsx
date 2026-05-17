import { useEffect } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette, useTheme } from '@/theme';

export type ToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 22;
const KNOB_PADDING = (TRACK_HEIGHT - KNOB_SIZE) / 2;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_PADDING * 2;

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: ToggleProps) {
  const theme = useTheme();
  const offset = useSharedValue(value ? KNOB_TRAVEL : 0);

  useEffect(() => {
    offset.value = withTiming(value ? KNOB_TRAVEL : 0, { duration: 160 });
  }, [value, offset]);

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const trackStyle: ViewStyle = {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: value ? theme.colors.accent : theme.colors.glassBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: value ? theme.colors.accent : theme.colors.glassBorder,
    padding: KNOB_PADDING,
    opacity: disabled ? 0.5 : 1,
  };

  const knobStyle: ViewStyle = {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: palette.cream,
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={trackStyle}
    >
      <Animated.View style={[knobStyle, knobAnimatedStyle]} />
    </Pressable>
  );
}
