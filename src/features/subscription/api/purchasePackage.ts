import { Purchases } from '@/lib/revenuecat';
import type { PurchasesPackage, CustomerInfo } from '../types';

export interface PurchaseResult {
  customerInfo: CustomerInfo;
  cancelled: false;
}

export interface PurchaseCancelled {
  cancelled: true;
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<PurchaseResult | PurchaseCancelled> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, cancelled: false };
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'userCancelled' in err &&
      (err as { userCancelled: boolean }).userCancelled
    ) {
      return { cancelled: true };
    }
    throw err;
  }
}
