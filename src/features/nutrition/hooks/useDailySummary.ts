import { useMemo } from 'react';
import { scaleNutrients, sumMacros } from '../lib/nutritionMath';
import type { NutritionEntryWithFood } from '../types';
import type { Targets } from '../lib/computeTargets';
import type { Macros } from '../lib/nutritionMath';

export interface DailySummary {
  total: Macros;
  targets: Targets | null;
}

export function useDailySummary(
  entries: NutritionEntryWithFood[] | undefined,
  targets: Targets | null,
): DailySummary {
  const total = useMemo(() => {
    if (!entries?.length) return { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 };
    return sumMacros(entries.map((e) => scaleNutrients(e.food, Number(e.quantity_grams))));
  }, [entries]);

  return { total, targets };
}
