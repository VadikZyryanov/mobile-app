import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export type ScreenProps = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  edges?: ReadonlyArray<Edge>;
  scrollViewProps?: ScrollViewProps;
  header?: ReactNode;
  footer?: ReactNode;
};

export function Screen({
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  children,
  style,
  scrollViewProps,
  header,
  footer,
  ...rest
}: ScreenProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.bg,
  };
  const innerStyle: ViewStyle = padded
    ? { flex: 1, paddingHorizontal: theme.spacing.base }
    : { flex: 1 };

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, innerStyle, style]}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[innerStyle, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={containerStyle} edges={edges as Edge[]}>
      {header}
      {content}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
