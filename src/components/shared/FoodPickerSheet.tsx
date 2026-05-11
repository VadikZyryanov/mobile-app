import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Food } from '@/features/nutrition/types';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  foods: Food[];
  isLoading?: boolean;
  onSelect: (food: Food) => void;
}

export function FoodPickerSheet({ query, onQueryChange, foods, isLoading, onSelect }: Props) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, gap: theme.spacing.md }}>
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Найти продукт..."
        placeholderTextColor={theme.colors.textMuted}
        autoFocus
        style={{
          paddingHorizontal: theme.spacing.base,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.bgElevated,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          color: theme.colors.text,
          fontSize: 16,
        }}
      />

      {isLoading ? (
        <Text variant="caption" color="textMuted" align="center">
          Загрузка...
        </Text>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: theme.colors.divider }} />
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.base,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="medium" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.brand && (
                  <Text variant="caption" color="textMuted">
                    {item.brand}
                  </Text>
                )}
              </View>
              <Text variant="caption" color="textMuted">
                {Math.round(item.kcal_per_100g)} ккал/100г
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text
              variant="caption"
              color="textMuted"
              align="center"
              style={{ paddingTop: theme.spacing.xl }}
            >
              {query ? 'Ничего не найдено' : 'Введите название продукта'}
            </Text>
          }
        />
      )}
    </View>
  );
}
