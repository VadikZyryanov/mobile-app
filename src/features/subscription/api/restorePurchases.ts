import { Purchases } from '@/lib/revenuecat';
import type { CustomerInfo } from '../types';

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
