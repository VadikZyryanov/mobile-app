import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppIcon } from './AppIcon';

export type AnimatedSplashProps = {
  visible: boolean;
  testID?: string;
};

const PINK = '#FF2D87';
const CREAM = '#EFE6D4';
const PINK_SOFT = '#FF7AB0';

// Animated brand splash: fade-in icon (overshoot scale + rotate), pulsing dots,
// orbiting ring on iOS, KNYAZEVA / TEAM word fade-in.
// Renders nothing when `visible` is false so it can be unmounted after hydrate.
export function AnimatedSplash({ visible, testID }: AnimatedSplashProps) {
  const iconScale = useSharedValue(0.7);
  const iconRotate = useSharedValue(-12);
  const iconOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordTranslate = useSharedValue(8);
  const subOpacity = useSharedValue(0);
  const subTranslate = useSharedValue(8);
  const dot0 = useSharedValue(0.3);
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const orbit = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    const overshoot = Easing.bezier(0.3, 1.4, 0.4, 1);

    iconScale.value = withSequence(
      withTiming(1.05, { duration: 700, easing: overshoot }),
      withTiming(0.98, { duration: 200 }),
      withTiming(1, { duration: 500 }),
    );
    iconRotate.value = withTiming(0, { duration: 1400, easing: overshoot });
    iconOpacity.value = withTiming(1, { duration: 600 });

    wordOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    wordTranslate.value = withDelay(600, withTiming(0, { duration: 800 }));
    subOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
    subTranslate.value = withDelay(1000, withTiming(0, { duration: 800 }));

    const makePulse = () =>
      withRepeat(
        withSequence(withTiming(1, { duration: 700 }), withTiming(0.3, { duration: 700 })),
        -1,
      );
    dot0.value = makePulse();
    dot1.value = withDelay(200, makePulse());
    dot2.value = withDelay(400, makePulse());

    if (Platform.OS !== 'android') {
      orbit.value = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1);
    }
  }, [
    visible,
    iconScale,
    iconRotate,
    iconOpacity,
    wordOpacity,
    wordTranslate,
    subOpacity,
    subTranslate,
    dot0,
    dot1,
    dot2,
    orbit,
  ]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }, { rotate: `${iconRotate.value}deg` }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordTranslate.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subTranslate.value }],
  }));
  const dot0Style = useAnimatedStyle(() => ({
    opacity: dot0.value,
    transform: [{ scale: dot0.value }],
  }));
  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ scale: dot1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ scale: dot2.value }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="auto" testID={testID}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="splashBg" cx="0.5" cy="0.4" rx="0.7" ry="0.7" fx="0.5" fy="0.4">
            <Stop offset="0" stopColor="#1D1925" />
            <Stop offset="1" stopColor="#0A0910" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#splashBg)" />
      </Svg>

      <View style={styles.center}>
        <View style={styles.iconArea}>
          {Platform.OS !== 'android' && (
            <Animated.View style={[StyleSheet.absoluteFill, orbitStyle]}>
              <Svg width="190" height="190" viewBox="0 0 100 100">
                <Circle
                  cx={50}
                  cy={50}
                  r={46}
                  fill="none"
                  stroke="rgba(255,45,135,0.18)"
                  strokeWidth={0.6}
                  strokeDasharray="2 4"
                />
                <Circle cx={96} cy={50} r={2.2} fill={PINK} />
              </Svg>
            </Animated.View>
          )}
          <Animated.View style={iconStyle}>
            <AppIcon size={160} radius={42} />
          </Animated.View>
        </View>

        <View style={styles.labels}>
          <Animated.Text style={[styles.word, wordStyle]}>KNYAZEVA</Animated.Text>
          <Animated.Text style={[styles.sub, subStyle]}>TEAM</Animated.Text>
        </View>
      </View>

      <View style={styles.dots}>
        <Animated.View style={[styles.dot, dot0Style]} />
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0910',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  center: {
    alignItems: 'center',
  },
  iconArea: {
    position: 'relative',
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    alignItems: 'center',
    marginTop: 32,
    gap: 10,
  },
  word: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 5.5,
    color: CREAM,
  },
  sub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 5,
    color: PINK_SOFT,
  },
  dots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PINK,
  },
});
