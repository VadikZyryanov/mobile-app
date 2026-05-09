import { Purchases } from '@/lib/revenuecat';
import type { CustomerInfo } from '../types';

export async function identifyUser(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

export async function resetUser(): Promise<CustomerInfo> {
  return Purchases.logOut();
}
