import { useState, type ReactNode, type Ref } from 'react';
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
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Input({
  label,
  error,
  hint,
  onFocus,
  onBlur,
  ref,
  leadingIcon,
  trailingIcon,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  const borderColor = hasError
    ? theme.colors.danger
    : focused
      ? theme.colors.accentSoft
      : theme.colors.divider;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderColor,
    backgroundColor: focused ? theme.colors.glassBg : theme.colors.bgElevated,
    ...(focused && !hasError
      ? {
          shadowColor: theme.colors.accent,
          shadowOpacity: 0.35,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
          elevation: 2,
        }
      : null),
  };

  const inputStyle: TextStyle = {
    flex: 1,
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
        {leadingIcon ? <View>{leadingIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={inputStyle}
          {...rest}
        />
        {trailingIcon ? <View>{trailingIcon}</View> : null}
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
