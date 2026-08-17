-- Mechanical Integrity Phase 4 - inspection plan indexes.

create index if not exists mi_inspection_plans_company_site_idx on public.mi_inspection_plans(company_id, site_id);
create index if not exists mi_inspection_plans_equipment_idx on public.mi_inspection_plans(equipment_id);
create index if not exists mi_inspection_plans_status_idx on public.mi_inspection_plans(status);
create index if not exists mi_inspection_plans_next_due_idx on public.mi_inspection_plans(current_next_due_date);
create index if not exists mi_inspection_plans_due_status_idx on public.mi_inspection_plans(current_due_status);
create index if not exists mi_inspection_plans_plan_type_idx on public.mi_inspection_plans(plan_type);
create index if not exists mi_inspection_occurrences_plan_due_idx on public.mi_inspection_schedule_occurrences(plan_id, due_date);
create index if not exists mi_inspection_occurrences_company_site_status_idx on public.mi_inspection_schedule_occurrences(company_id, site_id, status);
create index if not exists mi_inspection_evaluations_plan_time_idx on public.mi_inspection_due_date_evaluations(plan_id, evaluation_time desc);
create index if not exists mi_inspection_rules_company_site_active_idx on public.mi_inspection_schedule_rules(company_id, site_id, active);
create index if not exists mi_inspection_scheduler_runs_company_started_idx on public.mi_inspection_scheduler_runs(company_id, started_at desc);
