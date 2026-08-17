-- Mechanical Integrity Phase 3 - CML/TML indexes.

create index if not exists mi_equipment_technical_data_revisions_equipment_idx on public.mi_equipment_technical_data_revisions (equipment_id, created_at desc);
create index if not exists mi_cmls_equipment_idx on public.mi_cmls (equipment_id, active, cml_number);
create index if not exists mi_cmls_site_status_idx on public.mi_cmls (company_id, site_id, status);
create index if not exists mi_cml_readings_cml_idx on public.mi_cml_thickness_readings (cml_id, reading_date desc);
create index if not exists mi_cml_readings_equipment_idx on public.mi_cml_thickness_readings (equipment_id, reading_date desc);
create index if not exists mi_cml_snapshots_cml_idx on public.mi_cml_calculation_snapshots (cml_id, calculated_at desc);
create index if not exists mi_cml_alerts_equipment_idx on public.mi_cml_alerts (equipment_id, status, severity);
create index if not exists mi_cml_import_jobs_equipment_idx on public.mi_cml_import_jobs (equipment_id, created_at desc);
