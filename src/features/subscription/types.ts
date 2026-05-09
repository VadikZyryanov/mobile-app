import type { PurchasesPackage, PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import type { Database } from '@/lib/database.types';

export type Tier = Database['public']['Enums']['subscription_tier_enum'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status_enum'];

export type ActiveEntitlement = 'basic' | 'pro' | 'pro_max';

export const ENTITLEMENT_TO_TIER: Record<ActiveEntitlement, Tier> = {
  basic: 'basic',
  pro: 'pro',
  pro_max: 'pro_max',
};

export interface Plan {
  package: PurchasesPackage;
  tier: Tier;
  priceString: string;
  productId: string;
}

export type { CustomerInfo, PurchasesOffering, PurchasesPackage };
