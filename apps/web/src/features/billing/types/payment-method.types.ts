export type PaymentMethod = {
  id: string;
  company_id: string;
  provider: string;
  provider_payment_method_id?: string | null;
  type: string;
  brand?: string | null;
  last4?: string | null;
  exp_month?: number | null;
  exp_year?: number | null;
  is_default: boolean;
  status: string;
  created_at: string;
};
