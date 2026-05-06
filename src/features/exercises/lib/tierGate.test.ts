import { hasAccess, TIER_ORDER } from './tierGate';

describe('hasAccess', () => {
  it('free имеет доступ к free', () => {
    expect(hasAccess('free', 'free')).toBe(true);
  });
  it('free НЕ имеет доступа к basic/pro/pro_max', () => {
    expect(hasAccess('free', 'basic')).toBe(false);
    expect(hasAccess('free', 'pro')).toBe(false);
    expect(hasAccess('free', 'pro_max')).toBe(false);
  });
  it('basic имеет доступ к free и basic, не выше', () => {
    expect(hasAccess('basic', 'free')).toBe(true);
    expect(hasAccess('basic', 'basic')).toBe(true);
    expect(hasAccess('basic', 'pro')).toBe(false);
  });
  it('pro имеет доступ ко всему кроме pro_max', () => {
    expect(hasAccess('pro', 'pro')).toBe(true);
    expect(hasAccess('pro', 'pro_max')).toBe(false);
  });
  it('pro_max имеет доступ ко всему', () => {
    expect(hasAccess('pro_max', 'free')).toBe(true);
    expect(hasAccess('pro_max', 'pro_max')).toBe(true);
  });
  it('TIER_ORDER в правильном порядке', () => {
    expect(TIER_ORDER).toEqual(['free', 'basic', 'pro', 'pro_max']);
  });
});
