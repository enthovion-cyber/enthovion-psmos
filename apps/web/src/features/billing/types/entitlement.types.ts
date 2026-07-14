export type CompanyEntitlement = {
  id: string;
  company_id: string;
  plan_id?: string | null;
  source: string;
  entitlement_key: string;
  entitlement_type: string;
  enabled: boolean;
  limit_value?: number | null;
  limit_unit?: string | null;
  effective_from: string;
  effective_until?: string | null;
  config_json?: Record<string, unknown>;
};

export type EntitlementCheckResult = {
  allowed: boolean;
  reason?: string;
  requiredPlan?: string | null;
  entitlement?: CompanyEntitlement;
};
