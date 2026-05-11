# Iteration 5 — Pro Max: Nutrition Tracking Design Spec

**Date:** 2026-05-10  
**Status:** ✅ Done (2026-05-11)

## Overview

Дневник питания с подсчётом КБЖУ, доступный только для Pro Max. Остальные тарифы видят paywall при попытке открыть дневник и teaser-карточку в Profile.

## User Stories

- **Pro Max:** Открываю дневник → вижу дневную сводку по КБЖУ + 4 секции приёмов (Завтрак/Обед/Ужин/Перекус). Добавляю продукт через поиск. Ввожу граммы → вижу live preview макросов → сохраняю. Переключаю дату (вчера/сегодня/завтра). Настраиваю цели через форму (или задаю вручную).
- **Free/Basic/Pro:** Вижу teaser-карточку «Питание» в Profile → тап → paywall.

## Scope (MVP)

| Включено                         | Исключено                 |
| -------------------------------- | ------------------------- |
| Дневник питания                  | Штрих-коды                |
| ~74 продукта seed-база           | Open Food Facts           |
| Цели КБЖУ (авто + manual)        | Custom продукты           |
| Дневная сводка (суммирование)    | Рецепты/составные блюда   |
| Pro Max tier-gate (RLS + клиент) | Экспорт CSV/PDF           |
| —                                | Apple Health / Google Fit |

## Navigation

Стек `app/(tabs)/nutrition/` с `href: null` (без таб-кнопки, паттерн из Iter 2 для exercises).

Точки входа:

- **Home** (только Pro Max): компактная `DailyNutritionSummary` → открывает `/(tabs)/nutrition`
- **Profile** (все тарифы): `NutritionTeaserCard` — для Pro Max: ссылка на дневник; для остальных: paywall-preview

## DB Schema

### Enums

- `sex_enum`: `male | female`
- `activity_level_enum`: `sedentary | light | moderate | active | very_active`
- `weight_goal_enum`: `lose | maintain | gain`
- `meal_type_enum`: `breakfast | lunch | dinner | snack`

### profiles (расширение)

Добавлены: `sex`, `birth_date`, `height_cm`, `weight_kg`, `activity_level`, `weight_goal`, `kcal_target`, `protein_g_target`, `fat_g_target`, `carbs_g_target`

### foods

Admin-managed справочник продуктов. `on delete restrict` на FK из nutrition_entries — admin не может случайно удалить продукт, на который ссылаются записи.

### nutrition_entries

`user_id`, `food_id`, `meal_type`, `quantity_grams`, `consumed_on`, `consumed_at`. RLS: select=own, insert/update=own+pro_max, delete=own.

## КБЖУ Формулы

**BMR (Mifflin–St Jeor):**

- Мужчины: `10W + 6.25H - 5A + 5`
- Женщины: `10W + 6.25H - 5A - 161`

**TDEE:** `BMR × activity_factor × (1 + goal_delta)`

| Activity    | Factor | Goal     | Delta |
| ----------- | ------ | -------- | ----- |
| sedentary   | 1.2    | lose     | -0.15 |
| light       | 1.375  | maintain | 0     |
| moderate    | 1.55   | gain     | +0.10 |
| active      | 1.725  |          |       |
| very_active | 1.9    |          |       |

**Макро-распределение:** Б = вес×1.8г/кг, Ж = вес×1.0г/кг, У = остаток.

Manual override (все 4 поля заполнены в profile) имеет приоритет над авто-расчётом.

## Components

| Компонент               | Описание                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| `MacroProgressBar`      | Прогресс-бар для одного макронутриента. Over-target → `danger` цвет            |
| `DailyNutritionSummary` | Glass-карточка: ккал header + 4 MacroProgressBar. Compact-режим для Home       |
| `MealSection`           | Секция приёма пищи: заголовок, суммарный ккал, список FoodEntryRow, кнопка «+» |
| `FoodEntryRow`          | Строка: название, граммы, Б/Ж/У, ккал, кнопка ✕                                |
| `FoodPickerSheet`       | TextInput (autoFocus) + FlatList продуктов с ккал/100г                         |
| `QuantityStepper`       | Input граммов + кнопки ±10/±50                                                 |
| `NutritionTeaserCard`   | variant=open → ссылка на дневник; variant=locked → paywall                     |

## Screens

### `nutrition/index.tsx` — Дневник

- Paywall (не Pro Max) / дневник (Pro Max)
- Date stepper: ‹ [дата] ›
- `DailyNutritionSummary` + CTA «Задать цели» если targets=null
- 4 `MealSection` (breakfast/lunch/dinner/snack)

### `nutrition/add.tsx` — Добавить продукт

- Params: `meal`, `date`
- Stage 1: FoodPickerSheet (debounce 250ms → `useFoods`)
- Stage 2: QuantityStepper + live preview макросов → Submit

### `nutrition/targets.tsx` — Цели КБЖУ

- SegmentedRow: пол, активность, цель
- NumericInput: дата рождения, рост, вес
- Auto-preview расчётных целей
- Switch «Задать вручную» → 4 поля

## Tier Gate

| Слой       | Механизм                                                 |
| ---------- | -------------------------------------------------------- |
| RLS        | `has_pro_max_access()` security definer на insert/update |
| Client     | `hasAccess(tier, 'pro_max')` в `nutrition/index.tsx`     |
| Foods read | Открыто всем authenticated                               |

## React Query

| Запрос        | staleTime | gcTime |
| ------------- | --------- | ------ |
| Foods (без q) | 30 мин    | 60 мин |
| Foods (с q)   | 5 мин     | 30 мин |
| Daily entries | 1 мин     | 30 мин |

Mutations инвалидируют `qk.nutrition.entries(date)` → автообновление сводки.

## Tests

230 тестов итого (181 Iter 0–4 + 49 новых):

- `lib/computeTargets`: 7 кейсов (M/F × lose/maintain/gain, manual override, incomplete→null)
- `lib/nutritionMath`: 5 кейсов
- `api/*`: 15 кейсов (listFoods, listEntriesForDate, create/update/delete)
- `hooks/*`: 5 кейсов
- `MacroProgressBar`: 3, `DailyNutritionSummary`: 2, `FoodEntryRow`: 2
- Smoke screens (index, add, targets): 7 кейсов
