import { Purchases } from '@/lib/revenuecat';
import type { CustomerInfo } from '../types';

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}
