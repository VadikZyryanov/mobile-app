import { scaleNutrients, sumMacros } from './nutritionMath';

const CHICKEN: Parameters<typeof scaleNutrients>[0] = {
  kcal_per_100g: 165,
  protein_per_100g: 31,
  fat_per_100g: 3.6,
  carbs_per_100g: 0,
};

describe('scaleNutrients', () => {
  it('масштабирует 100г корректно', () => {
    expect(scaleNutrients(CHICKEN, 100)).toEqual({
      kcal: 165,
      protein_g: 31,
      fat_g: 3.6,
      carbs_g: 0,
    });
  });

  it('масштабирует 200г', () => {
    const result = scaleNutrients(CHICKEN, 200);
    expect(result.kcal).toBe(330);
    expect(result.protein_g).toBe(62);
    expect(result.fat_g).toBe(7.2);
  });

  it('возвращает нули при 0г', () => {
    expect(scaleNutrients(CHICKEN, 0)).toEqual({ kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
  });

  it('округляет до 1 знака', () => {
    const result = scaleNutrients(CHICKEN, 150);
    expect(result.fat_g).toBe(5.4); // 3.6 * 1.5 = 5.4
  });
});

describe('sumMacros', () => {
  it('возвращает нули для пустого массива', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
  });

  it('суммирует несколько записей', () => {
    const a = scaleNutrients(CHICKEN, 200);
    const b = { kcal: 130, protein_g: 2.7, fat_g: 0.3, carbs_g: 28 };
    const result = sumMacros([a, b]);
    expect(result.kcal).toBe(460);
    expect(result.protein_g).toBe(64.7);
  });

  it('суммирует одну запись без изменений', () => {
    const m = { kcal: 100, protein_g: 20, fat_g: 5, carbs_g: 10 };
    expect(sumMacros([m])).toEqual(m);
  });
});
