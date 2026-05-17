import { useState, type Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';
import { Text } from '../Text';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  hint?: string;
  ref?: Ref<TextInput>;
};

export function Input({ label, error, hint, onFocus, onBlur, ref, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  const containerStyle: ViewStyle = {
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderColor: hasError
      ? theme.colors.danger
      : focused
        ? theme.colors.accent
        : theme.colors.divider,
    backgroundColor: focused ? theme.colors.glassBg : theme.colors.bgElevated,
  };

  const inputStyle: TextStyle = {
    color: theme.colors.text,
    fontFamily: theme.fontFamily.body,
    ...theme.typography.bodyLg,
    padding: 0,
  };

  const handleFocus: TextInputProps['onFocus'] = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps['onBlur'] = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <Text variant="caption" color="textMuted" weight="medium">
          {label}
        </Text>
      ) : null}
      <View style={containerStyle}>
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={inputStyle}
          {...rest}
        />
      </View>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
