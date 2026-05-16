import { describe, expect, it } from 'vitest';
import { calcMrr, TIER_MONTHLY_PRICE_USD } from './mrrCalc';

describe('calcMrr', () => {
  it('возвращает 0 при пустом массиве', () => {
    expect(calcMrr([])).toBe(0);
  });

  it('суммирует активные тиры', () => {
    const result = calcMrr([
      { tier: 'basic', count: 10 },
      { tier: 'pro', count: 5 },
      { tier: 'pro_max', count: 2 },
    ]);
    const expected =
      10 * TIER_MONTHLY_PRICE_USD.basic! +
      5 * TIER_MONTHLY_PRICE_USD.pro! +
      2 * TIER_MONTHLY_PRICE_USD.pro_max!;
    expect(result).toBeCloseTo(expected);
  });

  it('игнорирует неизвестный тир', () => {
    expect(calcMrr([{ tier: 'unknown', count: 100 }])).toBe(0);
  });
});
