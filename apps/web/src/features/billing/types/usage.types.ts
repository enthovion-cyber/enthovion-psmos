export type UsageCounter = {
  id: string;
  company_id: string;
  site_id?: string | null;
  usage_key: string;
  usage_value: number;
  usage_unit: string;
  period_start?: string | null;
  period_end?: string | null;
  last_calculated_at?: string | null;
};

export type UsageLimitCard = {
  key: string;
  usageKey: string;
  used: number;
  allowed: number | null;
  unit: string;
  percent: number;
  nearLimit: boolean;
  exceeded: boolean;
};
