import { Purchases } from '@/lib/revenuecat';
import type { PurchasesOffering } from '../types';

export async function getOfferings(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}
