create unique index if not exists mi_deficiencies_company_site_record_uidx on public.mi_deficiencies(company_id, site_id, record_number);
create index if not exists mi_deficiencies_company_site_status_idx on public.mi_deficiencies(company_id, site_id, status);
create index if not exists mi_deficiencies_equipment_idx on public.mi_deficiencies(company_id, site_id, equipment_id);
create index if not exists mi_deficiencies_due_idx on public.mi_deficiencies(company_id, site_id, due_date, status);
create index if not exists mi_deficiencies_severity_idx on public.mi_deficiencies(company_id, site_id, severity, risk_level);
create index if not exists mi_deficiencies_startup_idx on public.mi_deficiencies(company_id, site_id, startup_blocker) where startup_blocker = true;

create unique index if not exists mi_deviations_company_site_record_uidx on public.mi_deviations(company_id, site_id, record_number);
create index if not exists mi_deviations_company_site_status_idx on public.mi_deviations(company_id, site_id, status);
create index if not exists mi_deviations_equipment_idx on public.mi_deviations(company_id, site_id, equipment_id);
create index if not exists mi_deviations_expiry_idx on public.mi_deviations(company_id, site_id, expiry_date, status);

create index if not exists mi_def_temp_controls_deficiency_idx on public.mi_deficiency_temporary_controls(deficiency_id);
create index if not exists mi_def_approvals_deficiency_idx on public.mi_deficiency_approvals(deficiency_id);
create index if not exists mi_def_approvals_deviation_idx on public.mi_deficiency_approvals(deviation_id);
create index if not exists mi_def_verifications_deficiency_idx on public.mi_deficiency_verifications(deficiency_id);
create index if not exists mi_def_linked_records_deficiency_idx on public.mi_deficiency_linked_records(deficiency_id);
create index if not exists mi_def_linked_records_deviation_idx on public.mi_deficiency_linked_records(deviation_id);
create index if not exists mi_def_history_deficiency_idx on public.mi_deficiency_history_events(deficiency_id, created_at desc);
create index if not exists mi_def_history_deviation_idx on public.mi_deficiency_history_events(deviation_id, created_at desc);
