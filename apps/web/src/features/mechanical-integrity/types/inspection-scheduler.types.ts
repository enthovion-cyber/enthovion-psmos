export type MiInspectionScheduleEvaluation = {
  id?: string;
  fixed_interval_due_date?: string | null;
  remaining_life_due_date?: string | null;
  half_life_due_date?: string | null;
  rule_based_due_date?: string | null;
  manual_override_due_date?: string | null;
  final_next_due_date?: string | null;
  final_due_basis?: string | null;
  governing_cml_number?: string | null;
  scheduler_status?: string | null;
  due_status?: string | null;
  days_until_due?: number | null;
  days_overdue?: number | null;
  scheduler_error?: string | null;
};
