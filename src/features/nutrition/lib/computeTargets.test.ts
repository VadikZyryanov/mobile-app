import { computeBMR, computeTargets } from './computeTargets';

const TODAY = new Date('2026-05-10');

const BASE_PROFILE = {
  sex: 'male' as const,
  birth_date: '1990-01-01',
  height_cm: 180,
  weight_kg: 80 as unknown as number,
  activity_level: 'moderate' as const,
  weight_goal: 'maintain' as const,
  kcal_target: null,
  protein_g_target: null,
  fat_g_target: null,
  carbs_g_target: null,
};

describe('computeBMR', () => {
  it('вычисляет BMR для мужчины', () => {
    const bmr = computeBMR('male', 80, 180, 36);
    // 10*80 + 6.25*180 - 5*36 + 5 = 800 + 1125 - 180 + 5 = 1750
    expect(bmr).toBe(1750);
  });

  it('вычисляет BMR для женщины', () => {
    const bmr = computeBMR('female', 60, 165, 30);
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    expect(bmr).toBeCloseTo(1320.25);
  });
});

describe('computeTargets', () => {
  it('возвращает null при неполном профиле', () => {
    expect(computeTargets({ ...BASE_PROFILE, sex: null }, TODAY)).toBeNull();
    expect(computeTargets({ ...BASE_PROFILE, birth_date: null }, TODAY)).toBeNull();
    expect(computeTargets({ ...BASE_PROFILE, height_cm: null }, TODAY)).toBeNull();
    expect(computeTargets({ ...BASE_PROFILE, weight_kg: null }, TODAY)).toBeNull();
    expect(computeTargets({ ...BASE_PROFILE, activity_level: null }, TODAY)).toBeNull();
    expect(computeTargets({ ...BASE_PROFILE, weight_goal: null }, TODAY)).toBeNull();
  });

  it('применяет manual override если все 4 поля заданы', () => {
    const result = computeTargets(
      {
        ...BASE_PROFILE,
        kcal_target: 2200,
        protein_g_target: 180,
        fat_g_target: 70,
        carbs_g_target: 220,
      },
      TODAY,
    );
    expect(result).toEqual({ kcal: 2200, protein_g: 180, fat_g: 70, carbs_g: 220 });
  });

  it('не применяет partial manual override', () => {
    const result = computeTargets({ ...BASE_PROFILE, kcal_target: 2200 }, TODAY);
    expect(result).not.toBeNull();
    expect(result?.kcal).not.toBe(2200);
  });

  it('вычисляет цели для мужчины с целью maintain', () => {
    const result = computeTargets(BASE_PROFILE, TODAY);
    expect(result).not.toBeNull();
    expect(result!.protein_g).toBe(144); // 80 * 1.8
    expect(result!.fat_g).toBe(80); // 80 * 1.0
    expect(result!.kcal).toBeGreaterThan(2000);
    expect(result!.carbs_g).toBeGreaterThan(0);
  });

  it('уменьшает ккал на 15% при цели lose', () => {
    const maintain = computeTargets(BASE_PROFILE, TODAY);
    const lose = computeTargets({ ...BASE_PROFILE, weight_goal: 'lose' }, TODAY);
    expect(lose!.kcal).toBeLessThan(maintain!.kcal);
    expect(lose!.kcal).toBeCloseTo(maintain!.kcal * 0.85, -1);
  });

  it('увеличивает ккал на 10% при цели gain', () => {
    const maintain = computeTargets(BASE_PROFILE, TODAY);
    const gain = computeTargets({ ...BASE_PROFILE, weight_goal: 'gain' }, TODAY);
    expect(gain!.kcal).toBeGreaterThan(maintain!.kcal);
    expect(gain!.kcal).toBeCloseTo(maintain!.kcal * 1.1, -1);
  });

  it('вычисляет цели для женщины', () => {
    const result = computeTargets(
      {
        ...BASE_PROFILE,
        sex: 'female',
        weight_kg: 60 as unknown as number,
        height_cm: 165,
        birth_date: '1996-01-01',
      },
      TODAY,
    );
    expect(result).not.toBeNull();
    expect(result!.protein_g).toBe(108); // 60 * 1.8
    expect(result!.fat_g).toBe(60);
  });
});
