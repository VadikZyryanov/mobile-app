import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/theme';

export function OfflineBanner() {
  const theme = useTheme();
  const { isOnline } = useNetworkStatus();
  const translateY = useSharedValue(isOnline ? -40 : 0);

  useEffect(() => {
    translateY.value = withTiming(isOnline ? -40 : 0, { duration: 300 });
  }, [isOnline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView
        intensity={theme.blur.regular}
        style={[
          styles.blur,
          {
            backgroundColor: theme.colors.glassBg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.glassBorder,
          },
        ]}
      >
        <Text variant="caption" weight="medium" color="textMuted" align="center">
          Нет соединения · показываю сохранённое
        </Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    height: 40,
  },
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
