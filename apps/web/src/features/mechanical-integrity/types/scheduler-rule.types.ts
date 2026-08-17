export type MiInspectionSchedulerRule = {
  id: string;
  rule_name: string;
  rule_scope?: string;
  site_id?: string | null;
  equipment_type_key?: string | null;
  plan_type?: string | null;
  inspection_method?: string | null;
  maximum_interval_value?: number;
  maximum_interval_unit?: string;
  due_soon_threshold_value?: number;
  critical_overdue_threshold_value?: number;
  active?: boolean;
  version?: number;
  effective_date?: string;
};
