export interface Per100g {
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
}

export interface Macros {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

export function scaleNutrients(food: Per100g, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: round1(food.kcal_per_100g * f),
    protein_g: round1(food.protein_per_100g * f),
    fat_g: round1(food.fat_per_100g * f),
    carbs_g: round1(food.carbs_per_100g * f),
  };
}

export function sumMacros(macros: Macros[]): Macros {
  return macros.reduce(
    (acc, m) => ({
      kcal: round1(acc.kcal + m.kcal),
      protein_g: round1(acc.protein_g + m.protein_g),
      fat_g: round1(acc.fat_g + m.fat_g),
      carbs_g: round1(acc.carbs_g + m.carbs_g),
    }),
    { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 },
  );
}
