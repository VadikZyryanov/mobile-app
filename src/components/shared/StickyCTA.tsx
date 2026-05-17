import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export type StickyCTAProps = Omit<ViewProps, 'children'> & {
  children: ReactNode;
};

const ANDROID_FALLBACK_BG = 'rgba(10,9,16,0.95)';

export function StickyCTA({ children, style, ...rest }: StickyCTAProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle = {
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.base,
    paddingBottom: insets.bottom + theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.glassBorder,
  };

  if (Platform.OS === 'android') {
    return (
      <View
        style={[styles.base, { backgroundColor: ANDROID_FALLBACK_BG }, containerStyle, style]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={80} tint="dark" style={[styles.base, containerStyle, style]} {...rest}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
