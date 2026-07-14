export type SubscriptionPlan = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  plan_type: string;
  status: string;
  public_visible: boolean;
  sort_order: number;
  trial_days?: number | null;
  default_currency: string;
  prices?: PlanPrice[];
  entitlements?: PlanEntitlement[];
};

export type PlanPrice = {
  id: string;
  plan_id: string;
  provider_price_id?: string | null;
  currency: string;
  billing_interval: string;
  amount_cents: number;
  seat_pricing_type: string;
  status: string;
};

export type PlanEntitlement = {
  id: string;
  plan_id: string;
  entitlement_key: string;
  entitlement_type: string;
  enabled: boolean;
  limit_value?: number | null;
  limit_unit?: string | null;
  config_json?: Record<string, unknown>;
};
