-- Mechanical Integrity Phase 5 - inspection record indexes.

create index if not exists mi_inspection_records_company_site_idx on public.mi_inspection_records (company_id, site_id);
create index if not exists mi_inspection_records_equipment_idx on public.mi_inspection_records (equipment_id, inspection_date desc);
create index if not exists mi_inspection_records_plan_idx on public.mi_inspection_records (plan_id);
create index if not exists mi_inspection_records_occurrence_idx on public.mi_inspection_records (occurrence_id);
create index if not exists mi_inspection_records_status_idx on public.mi_inspection_records (status);
create index if not exists mi_inspection_records_review_idx on public.mi_inspection_records (review_status);
create index if not exists mi_inspection_records_date_idx on public.mi_inspection_records (inspection_date desc);
create index if not exists mi_inspection_record_checklist_record_idx on public.mi_inspection_record_checklist_items (inspection_record_id, sort_order);
create index if not exists mi_inspection_record_readings_record_idx on public.mi_inspection_record_cml_readings (inspection_record_id);
create index if not exists mi_inspection_record_readings_cml_date_idx on public.mi_inspection_record_cml_readings (cml_id, reading_date desc);
create index if not exists mi_remaining_life_evaluations_equipment_official_idx on public.mi_remaining_life_evaluations (equipment_id, official, calculated_at desc);
create index if not exists mi_remaining_life_evaluations_cml_idx on public.mi_remaining_life_evaluations (cml_id, calculated_at desc);
create index if not exists mi_remaining_life_evaluations_alert_idx on public.mi_remaining_life_evaluations (alert_state);
create index if not exists mi_inspection_findings_equipment_status_idx on public.mi_inspection_findings (equipment_id, status);
create index if not exists mi_inspection_findings_record_idx on public.mi_inspection_findings (inspection_record_id);
create index if not exists mi_inspection_record_documents_record_idx on public.mi_inspection_record_documents (inspection_record_id);
create index if not exists mi_inspection_record_reviews_record_idx on public.mi_inspection_record_reviews (inspection_record_id, created_at desc);
create index if not exists mi_inspection_record_import_jobs_scope_idx on public.mi_inspection_record_import_jobs (company_id, site_id, created_at desc);
