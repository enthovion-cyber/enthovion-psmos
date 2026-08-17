-- Mechanical Integrity Phase 7 - PM/calibration indexes.

create index if not exists idx_mi_pm_plans_company_site on public.mi_pm_plans(company_id, site_id);
create index if not exists idx_mi_pm_plans_equipment on public.mi_pm_plans(equipment_id);
create index if not exists idx_mi_pm_plans_due on public.mi_pm_plans(current_next_due_date, current_due_status);
create index if not exists idx_mi_pm_occurrences_scope_status on public.mi_pm_occurrences(company_id, site_id, status);
create index if not exists idx_mi_pm_records_equipment_date on public.mi_pm_records(equipment_id, pm_date desc);
create index if not exists idx_mi_pm_findings_record on public.mi_pm_record_findings(pm_record_id, status);

create index if not exists idx_mi_calibration_plans_company_site on public.mi_calibration_plans(company_id, site_id);
create index if not exists idx_mi_calibration_plans_equipment on public.mi_calibration_plans(equipment_id);
create index if not exists idx_mi_calibration_plans_due on public.mi_calibration_plans(current_next_due_date, current_due_status);
create index if not exists idx_mi_calibration_occurrences_scope_status on public.mi_calibration_occurrences(company_id, site_id, status);
create index if not exists idx_mi_calibration_records_equipment_date on public.mi_calibration_records(equipment_id, calibration_date desc);
create index if not exists idx_mi_calibration_evaluations_equipment on public.mi_calibration_evaluations(equipment_id, official);
create index if not exists idx_mi_calibration_evaluations_result on public.mi_calibration_evaluations(final_result);
create index if not exists idx_mi_pm_calibration_history_equipment on public.mi_pm_calibration_history_events(equipment_id, created_at desc);
