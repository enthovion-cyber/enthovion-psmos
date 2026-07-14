import { RequestUser } from '../common/decorators/current-user.decorator';

export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'grace_period' | 'paused' | 'cancel_scheduled' | 'cancelled' | 'expired' | 'incomplete' | 'incomplete_expired' | 'manual_review' | 'enterprise_contract';
export type BillingAccessMode = 'full' | 'warning' | 'grace' | 'read_only' | 'locked';

export type BillingRequestMeta = {
  ip?: string | null | undefined;
  userAgent?: string | null | undefined;
};

export type BillingContext = {
  user: RequestUser;
  companyId: string;
  isPlatform: boolean;
};

export type EntitlementCheckInput = {
  entitlementKey?: string;
  moduleKey?: string;
  limitKey?: string;
  requestedValue?: number;
};

export type BillingProviderCheckoutInput = {
  companyId: string;
  planId: string;
  priceId?: string | null;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
};

export type BillingProviderCheckoutResult = {
  provider: string;
  providerSessionId: string;
  checkoutUrl: string;
};

export type BillingProviderPortalInput = {
  companyId: string;
  customerId?: string | null;
  returnUrl: string;
};

export type BillingProviderPortalResult = {
  provider: string;
  portalUrl: string;
};
