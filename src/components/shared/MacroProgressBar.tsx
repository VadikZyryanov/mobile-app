import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

interface Props {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
}

export function MacroProgressBar({ label, consumed, target, unit = 'г' }: Props) {
  const theme = useTheme();
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = target > 0 && consumed > target;
  const barColor = isOver ? theme.colors.danger : theme.colors.accent;

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <Text variant="caption" color="textMuted" weight="medium">
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <Text
            variant="caption"
            weight="semibold"
            style={{ color: isOver ? theme.colors.danger : theme.colors.text }}
          >
            {Math.round(consumed)}
          </Text>
          <Text variant="caption" color="textMuted">
            {'/'}
            {Math.round(target)}
            {unit}
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 4,
          borderRadius: theme.radii.full,
          backgroundColor: theme.colors.bgElevated,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${ratio * 100}%`,
            borderRadius: theme.radii.full,
            backgroundColor: barColor,
          }}
        />
      </View>
    </View>
  );
}
