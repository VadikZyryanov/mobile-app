import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const STEPS = [10, 50] as const;

export function QuantityStepper({ value, onChange }: Props) {
  const theme = useTheme();

  const handleText = (text: string) => {
    const n = parseInt(text, 10);
    if (!isNaN(n) && n > 0) onChange(n);
  };

  const adjust = (delta: number) => {
    const next = Math.max(1, value + delta);
    onChange(next);
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="caption" color="textMuted" weight="medium">
        Количество (г)
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {STEPS.map((step) => (
          <Pressable
            key={`-${step}`}
            onPress={() => adjust(-step)}
            style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 6,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.bgElevated,
              borderWidth: 1,
              borderColor: theme.colors.glassBorder,
            }}
          >
            <Text variant="caption" weight="medium">
              -{step}
            </Text>
          </Pressable>
        ))}

        <TextInput
          value={String(value)}
          onChangeText={handleText}
          keyboardType="number-pad"
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.text,
            paddingVertical: 8,
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.bgElevated,
            borderWidth: 1,
            borderColor: theme.colors.accent,
          }}
        />

        {STEPS.slice()
          .reverse()
          .map((step) => (
            <Pressable
              key={`+${step}`}
              onPress={() => adjust(step)}
              style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 6,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.bgElevated,
                borderWidth: 1,
                borderColor: theme.colors.glassBorder,
              }}
            >
              <Text variant="caption" weight="medium">
                +{step}
              </Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}
