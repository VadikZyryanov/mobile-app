import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { storage, StorageKeys } from '@/lib/storage';
import { useTheme } from '@/theme';

type Slide = { key: string; title: string; body: string; emoji: string };

const SLIDES: readonly Slide[] = [
  {
    key: '1',
    title: 'Тренировки на каждый день',
    body: 'Готовые программы и отдельные тренировки для дома и зала.',
    emoji: '💪',
  },
  {
    key: '2',
    title: 'Блог тренера',
    body: 'Разборы техники, советы по восстановлению, новости в твоём фиде.',
    emoji: '📝',
  },
  {
    key: '3',
    title: 'Твой прогресс остаётся с тобой',
    body: 'История тренировок, любимые программы, индивидуальный план — всё синхронизируется.',
    emoji: '📈',
  },
];

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const theme = useTheme();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await storage.set(StorageKeys.onboardingCompleted, 'true');
    router.replace('/(auth)/onboarding');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      void finish();
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <Screen>
      <View
        style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: theme.spacing.base }}
      >
        <Pressable onPress={() => void finish()} accessibilityRole="button">
          <Text variant="body" color="textMuted">
            Пропустить
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              paddingHorizontal: theme.spacing.lg,
              gap: theme.spacing.lg,
              justifyContent: 'center',
            }}
          >
            <Card variant="glass">
              <View style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'] }}>
                <Text variant="heroLg">{item.emoji}</Text>
              </View>
            </Card>
            <Text variant="hero" weight="bold" align="center">
              {item.title}
            </Text>
            <Text variant="bodyLg" color="textMuted" align="center">
              {item.body}
            </Text>
          </View>
        )}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.lg,
        }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? theme.colors.accent : theme.colors.divider,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <Button
          label={index === SLIDES.length - 1 ? 'Начать' : 'Дальше'}
          fullWidth
          onPress={next}
        />
      </View>
    </Screen>
  );
}
