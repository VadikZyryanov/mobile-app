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
};

export function Screen({
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  children,
  style,
  scrollViewProps,
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

  if (scroll) {
    return (
      <SafeAreaView style={containerStyle} edges={edges as Edge[]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, innerStyle, style]}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={edges as Edge[]}>
      <View style={[innerStyle, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
