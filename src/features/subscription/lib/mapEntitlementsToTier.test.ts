import { mapEntitlementsToTier } from './mapEntitlementsToTier';
import type { CustomerInfo } from '../types';

function makeCustomerInfo(activeEntitlements: string[]): CustomerInfo {
  const active = Object.fromEntries(
    activeEntitlements.map((id) => [
      id,
      {
        identifier: id,
        isActive: true,
        willRenew: true,
        latestPurchaseDateMillis: 0,
        originalPurchaseDateMillis: 0,
        expirationDateMillis: null,
        productIdentifier: id,
        productPlanIdentifier: null,
        isSandbox: false,
        unsubscribeDetectedAt: null,
        billingIssueDetectedAt: null,
        ownershipType: 'PURCHASED',
        periodType: 'NORMAL',
        store: 'APP_STORE',
        verificationType: 'NOT_REQUESTED',
      },
    ]),
  );
  return { entitlements: { active, all: active } } as unknown as CustomerInfo;
}

describe('mapEntitlementsToTier', () => {
  it('returns free when no entitlements', () => {
    expect(mapEntitlementsToTier(makeCustomerInfo([]))).toBe('free');
  });

  it('returns basic when only basic entitlement', () => {
    expect(mapEntitlementsToTier(makeCustomerInfo(['basic']))).toBe('basic');
  });

  it('returns pro when only pro entitlement', () => {
    expect(mapEntitlementsToTier(makeCustomerInfo(['pro']))).toBe('pro');
  });

  it('returns pro_max when only pro_max entitlement', () => {
    expect(mapEntitlementsToTier(makeCustomerInfo(['pro_max']))).toBe('pro_max');
  });

  it('returns pro_max when both pro and pro_max active (max wins)', () => {
    expect(mapEntitlementsToTier(makeCustomerInfo(['pro', 'pro_max']))).toBe('pro_max');
  });

  it('returns pro_max when basic, pro, pro_max all active', () => {
    expect(mapEntitlementsToTier(makeCustomerInfo(['basic', 'pro', 'pro_max']))).toBe('pro_max');
  });

  it('ignores unknown entitlements', () => {
    expect(mapEntitlementsToTier(makeCustomerInfo(['unknown_entitlement']))).toBe('free');
  });
});
