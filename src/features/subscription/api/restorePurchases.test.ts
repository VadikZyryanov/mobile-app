import { Purchases } from '@/lib/revenuecat';
import { restorePurchases } from './restorePurchases';

const mockCustomerInfo = { entitlements: { active: {} } };

describe('restorePurchases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls Purchases.restorePurchases and returns customerInfo', async () => {
    (Purchases.restorePurchases as jest.Mock).mockResolvedValue(mockCustomerInfo);

    const result = await restorePurchases();
    expect(result).toBe(mockCustomerInfo);
    expect(Purchases.restorePurchases).toHaveBeenCalledTimes(1);
  });

  it('propagates errors', async () => {
    (Purchases.restorePurchases as jest.Mock).mockRejectedValue(new Error('Restore failed'));

    await expect(restorePurchases()).rejects.toThrow('Restore failed');
  });
});
