import { describe, expect, it } from 'vitest';
import { hasAccess } from './hasAccess';

describe('hasAccess', () => {
  it('free → basic: нет', () => {
    expect(hasAccess('free', 'basic')).toBe(false);
  });
  it('basic → basic: есть', () => {
    expect(hasAccess('basic', 'basic')).toBe(true);
  });
  it('pro → basic: есть', () => {
    expect(hasAccess('pro', 'basic')).toBe(true);
  });
  it('pro → pro_max: нет', () => {
    expect(hasAccess('pro', 'pro_max')).toBe(false);
  });
  it('pro_max → free: есть', () => {
    expect(hasAccess('pro_max', 'free')).toBe(true);
  });
});
