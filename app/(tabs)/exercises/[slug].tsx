import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { PaywallCard, QueryView } from '@/components/shared';
import { useExercise, useExerciseGifUrl, useExerciseVideoUrl } from '@/features/exercises/hooks';
import { hasAccess, type Tier } from '@/features/exercises/lib/tierGate';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useTheme } from '@/theme';

export default function ExerciseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const exercise = useExercise(slug);
  const gif = useExerciseGifUrl(slug ?? '');
  const profile = useProfile();
  const userTier = (profile.data?.subscription_tier ?? 'free') as Tier;
  const minTier = (exercise.data?.min_tier ?? 'free') as Tier;
  const allowed = hasAccess(userTier, minTier);
  const video = useExerciseVideoUrl(slug ?? '', allowed && Boolean(exercise.data?.video_path));
  const player = useVideoPlayer(video.data ?? null);

  useEffect(() => {
    if (player && video.data) player.play();
  }, [player, video.data]);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.glassBg,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyLg">‹</Text>
        </Pressable>

        <QueryView
          isLoading={exercise.isLoading}
          isError={exercise.isError}
          isEmpty={false}
          onRetry={() => exercise.refetch()}
        >
          {exercise.data && (
            <View style={{ gap: theme.spacing.lg }}>
              <View
                style={{
                  height: 280,
                  borderRadius: theme.radii.xl,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.bgElevated,
                }}
              >
                {gif.data && (
                  <Image
                    source={{ uri: gif.data }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                )}
              </View>

              <Text variant="hero" weight="bold">
                {exercise.data.name}
              </Text>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                <Chip text={exercise.data.primary_muscle} />
                {exercise.data.secondary_muscles.map((m) => (
                  <Chip key={m} text={m} muted />
                ))}
                {exercise.data.equipment.map((eq) => (
                  <Chip key={eq} text={eq} muted />
                ))}
              </View>

              {exercise.data.description && (
                <Text variant="bodyLg" color="textMuted">
                  {exercise.data.description}
                </Text>
              )}

              {exercise.data.video_path && (
                <View style={{ gap: theme.spacing.md }}>
                  <Text variant="titleLg" weight="semibold">
                    Видео техники
                  </Text>
                  {!allowed ? (
                    <PaywallCard requiredTier={minTier} />
                  ) : (
                    <View
                      style={{
                        height: 220,
                        borderRadius: theme.radii.xl,
                        overflow: 'hidden',
                        backgroundColor: theme.colors.bgElevated,
                      }}
                    >
                      {video.data && (
                        <VideoView
                          player={player}
                          style={{ width: '100%', height: '100%' }}
                          allowsFullscreen
                          contentFit="cover"
                        />
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </QueryView>
      </ScrollView>
    </Screen>
  );
}

function Chip({ text, muted }: { text: string; muted?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.full,
        backgroundColor: muted ? theme.colors.bgElevated : theme.colors.accent,
      }}
    >
      <Text
        variant="caption"
        weight="medium"
        color={muted ? 'text' : undefined}
        style={muted ? undefined : { color: theme.palette.white }}
      >
        {text}
      </Text>
    </View>
  );
}
