import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useTheme } from '@/theme';

type Props = {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function QueryView({
  isLoading,
  isError,
  isEmpty = false,
  emptyText = 'Ничего не найдено',
  onRetry,
  children,
}: Props) {
  const theme = useTheme();
  const center = {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: theme.spacing['2xl'],
    gap: theme.spacing.md,
  };

  if (isLoading) {
    return (
      <View style={center}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text variant="caption" color="textMuted">
          Загрузка
        </Text>
      </View>
    );
  }
  if (isError) {
    return (
      <View style={center}>
        <Text variant="bodyLg" weight="semibold">
          Не удалось загрузить
        </Text>
        <Text variant="caption" color="textMuted" align="center">
          Проверьте соединение и попробуйте ещё раз
        </Text>
        {onRetry && <Button label="Повторить" variant="secondary" size="sm" onPress={onRetry} />}
      </View>
    );
  }
  if (isEmpty) {
    return (
      <View style={center}>
        <Text variant="caption" color="textMuted">
          {emptyText}
        </Text>
      </View>
    );
  }
  return <>{children}</>;
}
