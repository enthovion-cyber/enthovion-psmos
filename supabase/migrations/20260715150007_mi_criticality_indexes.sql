-- Mechanical Integrity Phase 6 - criticality indexes.

create index if not exists idx_mi_criticality_assessments_company_site on public.mi_criticality_assessments(company_id, site_id);
create index if not exists idx_mi_criticality_assessments_equipment on public.mi_criticality_assessments(equipment_id);
create index if not exists idx_mi_criticality_assessments_status on public.mi_criticality_assessments(status);
create index if not exists idx_mi_criticality_assessments_approval on public.mi_criticality_assessments(approval_status);
create index if not exists idx_mi_criticality_assessments_category on public.mi_criticality_assessments(criticality_category);
create index if not exists idx_mi_criticality_assessments_safety on public.mi_criticality_assessments(safety_critical);
create index if not exists idx_mi_criticality_assessments_psm on public.mi_criticality_assessments(psm_critical);
create index if not exists idx_mi_criticality_assessments_next_review on public.mi_criticality_assessments(next_review_due);
create index if not exists idx_mi_criticality_configs_scope_active on public.mi_criticality_configs(company_id, site_id, active);
create index if not exists idx_mi_criticality_calculation_assessment on public.mi_criticality_calculation_results(assessment_id);
create index if not exists idx_mi_criticality_history_equipment_created on public.mi_criticality_history_events(equipment_id, created_at desc);
create index if not exists idx_mi_criticality_import_rows_job on public.mi_criticality_import_rows(job_id, row_number);
