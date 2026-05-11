import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { Screen, Text, Button } from '@/components/ui';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile';
import { computeTargets } from '@/features/nutrition/lib/computeTargets';
import { useTheme } from '@/theme';
import type { Database } from '@/lib/database.types';

type Sex = Database['public']['Enums']['sex_enum'];
type Activity = Database['public']['Enums']['activity_level_enum'];
type Goal = Database['public']['Enums']['weight_goal_enum'];

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: 'Сидячий',
  light: 'Лёгкая',
  moderate: 'Умеренная',
  active: 'Активная',
  very_active: 'Очень активная',
};

const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Похудение',
  maintain: 'Поддержание',
  gain: 'Набор массы',
};

function NumericInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {label && (
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={{
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.bgElevated,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          color: theme.colors.text,
          fontSize: 16,
        }}
      />
    </View>
  );
}

function SegmentedRow<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {options.map((opt) => (
        <Button
          key={opt}
          label={labels[opt]}
          variant={value === opt ? 'primary' : 'secondary'}
          size="sm"
          onPress={() => onChange(opt)}
        />
      ))}
    </View>
  );
}

export default function NutritionTargetsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const data = profile.data;

  const [sex, setSex] = useState<Sex | null>((data?.sex as Sex) ?? null);
  const [birthDate, setBirthDate] = useState(data?.birth_date?.slice(0, 10) ?? '');
  const [heightCm, setHeightCm] = useState(String(data?.height_cm ?? ''));
  const [weightKg, setWeightKg] = useState(String(data?.weight_kg ?? ''));
  const [activity, setActivity] = useState<Activity | null>(
    (data?.activity_level as Activity) ?? null,
  );
  const [goal, setGoal] = useState<Goal | null>((data?.weight_goal as Goal) ?? null);

  const [manualMode, setManualMode] = useState(
    !!(
      data?.kcal_target &&
      data?.protein_g_target != null &&
      data?.fat_g_target != null &&
      data?.carbs_g_target != null
    ),
  );
  const [kcal, setKcal] = useState(String(data?.kcal_target ?? ''));
  const [protein, setProtein] = useState(String(data?.protein_g_target ?? ''));
  const [fat, setFat] = useState(String(data?.fat_g_target ?? ''));
  const [carbs, setCarbs] = useState(String(data?.carbs_g_target ?? ''));

  const autoTargets = computeTargets({
    sex,
    birth_date: birthDate || null,
    height_cm: heightCm ? parseInt(heightCm) : null,
    weight_kg: weightKg ? (parseFloat(weightKg) as unknown as number) : null,
    activity_level: activity,
    weight_goal: goal,
    kcal_target: null,
    protein_g_target: null,
    fat_g_target: null,
    carbs_g_target: null,
  });

  const handleSave = () => {
    const patch: Record<string, unknown> = {
      sex,
      birth_date: birthDate || null,
      height_cm: heightCm ? parseInt(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      activity_level: activity,
      weight_goal: goal,
    };

    if (manualMode) {
      patch.kcal_target = kcal ? parseInt(kcal) : null;
      patch.protein_g_target = protein ? parseInt(protein) : null;
      patch.fat_g_target = fat ? parseInt(fat) : null;
      patch.carbs_g_target = carbs ? parseInt(carbs) : null;
    } else {
      patch.kcal_target = null;
      patch.protein_g_target = null;
      patch.fat_g_target = null;
      patch.carbs_g_target = null;
    }

    updateProfile.mutate(patch as never, { onSuccess: () => router.back() });
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          paddingBottom: theme.spacing['3xl'],
        }}
      >
        <Text variant="titleLg" weight="bold">
          Цели питания
        </Text>

        {/* Физ. параметры */}
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="bodyLg" weight="semibold">
            Пол
          </Text>
          <SegmentedRow
            options={['male', 'female'] as Sex[]}
            labels={{ male: 'Мужской', female: 'Женский' }}
            value={sex}
            onChange={setSex}
          />
        </View>

        <NumericInput
          label="Дата рождения (ГГГГ-ММ-ДД)"
          value={birthDate}
          onChange={setBirthDate}
          placeholder="1990-01-15"
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <NumericInput
              label="Рост (см)"
              value={heightCm}
              onChange={setHeightCm}
              placeholder="175"
            />
          </View>
          <View style={{ flex: 1 }}>
            <NumericInput
              label="Вес (кг)"
              value={weightKg}
              onChange={setWeightKg}
              placeholder="75"
            />
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="bodyLg" weight="semibold">
            Уровень активности
          </Text>
          <SegmentedRow
            options={Object.keys(ACTIVITY_LABELS) as Activity[]}
            labels={ACTIVITY_LABELS}
            value={activity}
            onChange={setActivity}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="bodyLg" weight="semibold">
            Цель
          </Text>
          <SegmentedRow
            options={Object.keys(GOAL_LABELS) as Goal[]}
            labels={GOAL_LABELS}
            value={goal}
            onChange={setGoal}
          />
        </View>

        {/* Auto preview */}
        {autoTargets && !manualMode && (
          <View
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.bgElevated,
              gap: theme.spacing.xs,
            }}
          >
            <Text variant="caption" color="textMuted">
              Расчётные цели
            </Text>
            <Text variant="bodyLg" weight="bold">
              {autoTargets.kcal} ккал
            </Text>
            <Text variant="caption" color="textMuted">
              Б {autoTargets.protein_g}г · Ж {autoTargets.fat_g}г · У {autoTargets.carbs_g}г
            </Text>
          </View>
        )}

        {/* Manual toggle */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="body" weight="medium">
            Задать вручную
          </Text>
          <Switch
            value={manualMode}
            onValueChange={setManualMode}
            trackColor={{ true: theme.colors.accent }}
          />
        </View>

        {manualMode && (
          <View style={{ gap: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <NumericInput label="Ккал" value={kcal} onChange={setKcal} placeholder="2000" />
              </View>
              <View style={{ flex: 1 }}>
                <NumericInput
                  label="Белки (г)"
                  value={protein}
                  onChange={setProtein}
                  placeholder="150"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <NumericInput label="Жиры (г)" value={fat} onChange={setFat} placeholder="70" />
              </View>
              <View style={{ flex: 1 }}>
                <NumericInput
                  label="Углеводы (г)"
                  value={carbs}
                  onChange={setCarbs}
                  placeholder="200"
                />
              </View>
            </View>
          </View>
        )}

        <Button
          label={updateProfile.isPending ? 'Сохранение...' : 'Сохранить'}
          variant="primary"
          size="lg"
          onPress={handleSave}
        />
      </ScrollView>
    </Screen>
  );
}
