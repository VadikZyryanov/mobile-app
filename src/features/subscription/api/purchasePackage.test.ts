import { Purchases } from '@/lib/revenuecat';
import { purchasePackage } from './purchasePackage';
import type { PurchasesPackage } from '../types';

const mockPkg = { identifier: 'pro_monthly' } as PurchasesPackage;

const mockCustomerInfo = { entitlements: { active: { pro: {} } } };

describe('purchasePackage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns customerInfo on success', async () => {
    (Purchases.purchasePackage as jest.Mock).mockResolvedValue({
      customerInfo: mockCustomerInfo,
    });

    const result = await purchasePackage(mockPkg);
    expect(result).toEqual({ customerInfo: mockCustomerInfo, cancelled: false });
  });

  it('returns cancelled:true when user cancels', async () => {
    (Purchases.purchasePackage as jest.Mock).mockRejectedValue({ userCancelled: true });

    const result = await purchasePackage(mockPkg);
    expect(result).toEqual({ cancelled: true });
  });

  it('rethrows other errors', async () => {
    const error = new Error('Network error');
    (Purchases.purchasePackage as jest.Mock).mockRejectedValue(error);

    await expect(purchasePackage(mockPkg)).rejects.toThrow('Network error');
  });
});
