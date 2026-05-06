import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.glassBorder,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={theme.blur.strong}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: Platform.OS === 'android' ? theme.colors.bg : theme.colors.glassBg,
              },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Главная' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Тренировки' }} />
      <Tabs.Screen name="blog" options={{ title: 'Блог' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
