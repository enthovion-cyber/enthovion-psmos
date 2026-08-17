-- Mechanical Integrity Phase 1 - indexes.

create index if not exists idx_mi_equipment_company_site on public.mi_equipment(company_id, site_id);
create index if not exists idx_mi_equipment_site_unit_area on public.mi_equipment(site_id, unit_id, area_id);
create index if not exists idx_mi_equipment_type_key on public.mi_equipment(equipment_type_key);
create index if not exists idx_mi_equipment_status on public.mi_equipment(status);
create index if not exists idx_mi_integrity_criticality on public.mi_equipment_integrity_status(criticality_category);
create index if not exists idx_mi_integrity_fitness on public.mi_equipment_integrity_status(fitness_status);
create index if not exists idx_mi_integrity_startup_blocked on public.mi_equipment_integrity_status(startup_blocked);
create index if not exists idx_mi_integrity_bypass on public.mi_equipment_integrity_status(bypass_active);
create index if not exists idx_mi_schedule_next_inspection on public.mi_equipment_schedule_summary(next_inspection_due_date);
create index if not exists idx_mi_schedule_next_pm on public.mi_equipment_schedule_summary(next_pm_due_date);
create index if not exists idx_mi_schedule_next_calibration on public.mi_equipment_schedule_summary(next_calibration_due_date);
create index if not exists idx_mi_history_equipment_created on public.mi_equipment_history_events(equipment_id, created_at desc);
create index if not exists idx_mi_audit_company_created on public.mi_equipment_audit_events(company_id, created_at desc);
