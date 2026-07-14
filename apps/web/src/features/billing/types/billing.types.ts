import type { CompanyEntitlement } from './entitlement.types';
import type { BillingInvoice } from './invoice.types';
import type { PaymentMethod } from './payment-method.types';
import type { SubscriptionPlan } from './plan.types';
import type { CompanySubscription } from './subscription.types';
import type { UsageCounter, UsageLimitCard } from './usage.types';

export type BillingAccessMode = 'full' | 'warning' | 'grace' | 'read_only' | 'locked';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'grace_period' | 'paused' | 'cancel_scheduled' | 'cancelled' | 'expired' | 'incomplete' | 'incomplete_expired' | 'manual_review' | 'enterprise_contract';

export type BillingOverview = {
  companyId: string;
  subscription: CompanySubscription | null;
  plan: SubscriptionPlan | null;
  accessMode: BillingAccessMode;
  status: BillingStatus;
  entitlements: CompanyEntitlement[];
  enabledModules: CompanyEntitlement[];
  disabledModules: CompanyEntitlement[];
  usage: UsageCounter[];
  limitCards: UsageLimitCard[];
  invoices: BillingInvoice[];
  paymentMethods: PaymentMethod[];
  audit: BillingAuditEvent[];
  actions: BillingActions;
};

export type BillingActions = {
  canCheckout: boolean;
  canChangePlan: boolean;
  canCancel: boolean;
  canReactivate: boolean;
};

export type BillingAuditEvent = {
  id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  actor_user_id?: string | null;
  created_at: string;
  after_value_json?: unknown;
};
