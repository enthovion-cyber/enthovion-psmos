import type { BillingAccessMode, BillingStatus } from './billing.types';

export type CompanySubscription = {
  id: string;
  company_id: string;
  plan_id: string | null;
  provider: string;
  provider_subscription_id?: string | null;
  status: BillingStatus;
  access_mode: BillingAccessMode;
  billing_interval: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  grace_period_start?: string | null;
  grace_period_end?: string | null;
  payment_failed_at?: string | null;
  latest_invoice_id?: string | null;
};
