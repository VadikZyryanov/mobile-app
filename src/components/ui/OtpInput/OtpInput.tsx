import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';
import { Text } from '../Text';

export type OtpInputProps = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

const CELL_WIDTH = 48;
const CELL_HEIGHT = 64;
const CELL_GAP = 8;
const CELL_RADIUS = 16;

export function OtpInput({
  value,
  onChange,
  length = 6,
  onComplete,
  autoFocus = false,
  accessibilityLabel = 'OTP',
  testID,
}: OtpInputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const sanitized = value.replace(/\D/g, '').slice(0, length);

  const handleChange: TextInputProps['onChangeText'] = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const cells = Array.from({ length }, (_, idx) => {
    const char = sanitized[idx] ?? '';
    const isActiveCell = focused && sanitized.length === idx;
    const cellStyle: ViewStyle = {
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      borderRadius: CELL_RADIUS,
      borderWidth: isActiveCell ? 2 : StyleSheet.hairlineWidth,
      borderColor: isActiveCell
        ? theme.colors.accent
        : char
          ? theme.colors.accentSoft
          : theme.colors.glassBorder,
      backgroundColor: theme.colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    };
    return (
      <View key={idx} style={cellStyle}>
        <Text variant="h1" family="mono" color="text">
          {char}
        </Text>
      </View>
    );
  });

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={() => inputRef.current?.focus()}
      style={{ flexDirection: 'row', gap: CELL_GAP }}
    >
      {cells}
      <TextInput
        ref={inputRef}
        value={sanitized}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        accessibilityLabel={`${accessibilityLabel}-input`}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />
    </Pressable>
  );
}
