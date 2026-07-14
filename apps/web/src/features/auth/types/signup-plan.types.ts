export type SignupPlanPrice = {
  id: string;
  currency: string;
  billing_interval: string;
  amount_cents: number;
  seat_pricing_type: string;
  status: string;
};

export type SignupPlan = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  plan_type: 'trial' | 'starter' | 'pro' | 'enterprise' | 'custom';
  status: string;
  public_visible: boolean;
  sort_order: number;
  trial_days?: number | null;
  default_currency: string;
  prices?: SignupPlanPrice[];
};

export type SignupPlansResult = {
  plans: SignupPlan[];
  billingConfigured: boolean;
};
