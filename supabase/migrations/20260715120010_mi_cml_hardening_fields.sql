-- Mechanical Integrity Phase 3 hardening - complete PDF field coverage.

alter table public.mi_cmls
  add column if not exists description text null,
  add column if not exists equipment_section text null,
  add column if not exists piping_circuit text null,
  add column if not exists vessel_section text null,
  add column if not exists tank_section text null,
  add column if not exists orientation text null,
  add column if not exists clock_position text null,
  add column if not exists elevation text null,
  add column if not exists distance_from_reference text null,
  add column if not exists isometric_reference text null,
  add column if not exists material text null,
  add column if not exists material_specification text null,
  add column if not exists weld_seam_nearby boolean null,
  add column if not exists deadleg boolean null,
  add column if not exists injection_point_nearby boolean null,
  add column if not exists corrosion_zone text null,
  add column if not exists insulated boolean null,
  add column if not exists cui_risk boolean null,
  add column if not exists critical_thickness numeric(12,4) null,
  add column if not exists overdue_threshold_days integer null,
  add column if not exists manual_alert_override_reason text null,
  add column if not exists ut_technique text null,
  add column if not exists last_reading_date date null,
  add column if not exists next_due_date date null,
  add column if not exists next_due_basis text null,
  add column if not exists next_due_source text null,
  add column if not exists inspection_procedure text null,
  add column if not exists responsible_user_id text null,
  add column if not exists responsible_team_id text null,
  add column if not exists corrosion_rate_method text null,
  add column if not exists use_short_term_rate boolean null,
  add column if not exists use_long_term_rate boolean null,
  add column if not exists governing_rate_method text null,
  add column if not exists minimum_rate_floor numeric(12,5) null,
  add column if not exists remaining_life_method text null,
  add column if not exists next_due_rule_source text null,
  add column if not exists rule_config_reference text null,
  add column if not exists manual_calculation_override boolean not null default false,
  add column if not exists override_reason text null,
  add column if not exists photo_document_id text null,
  add column if not exists design_basis_notes text null;

alter table public.mi_cml_calculation_snapshots
  add column if not exists latest_approved_reading_id text null,
  add column if not exists current_thickness numeric(12,4) null,
  add column if not exists current_thickness_unit text null,
  add column if not exists current_reading_date date null,
  add column if not exists previous_thickness numeric(12,4) null,
  add column if not exists previous_reading_date date null,
  add column if not exists original_thickness numeric(12,4) null,
  add column if not exists minimum_required_thickness numeric(12,4) null,
  add column if not exists alert_thickness numeric(12,4) null,
  add column if not exists retirement_thickness numeric(12,4) null,
  add column if not exists governing_rate_method text null,
  add column if not exists half_life_interval_years numeric(12,3) null,
  add column if not exists half_life_due_date date null,
  add column if not exists fixed_interval_due_date date null,
  add column if not exists rule_based_due_date date null,
  add column if not exists final_next_due_date date null,
  add column if not exists next_due_source text null,
  add column if not exists alert_state text null,
  add column if not exists calculation_error text null,
  add column if not exists manual_override boolean not null default false,
  add column if not exists override_reason text null,
  add column if not exists scheduler_status text null,
  add column if not exists scheduler_last_run_at timestamptz null,
  add column if not exists scheduler_error text null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.mi_cml_reading_campaigns
  add column if not exists inspection_type text null,
  add column if not exists inspector_name text null,
  add column if not exists inspection_vendor text null,
  add column if not exists procedure_document_id text null,
  add column if not exists instrument_used text null,
  add column if not exists instrument_serial_number text null,
  add column if not exists calibration_certificate_document_id text null,
  add column if not exists report_document_id text null,
  add column if not exists operating_condition_notes text null,
  add column if not exists reviewed_by text null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists approved_by text null,
  add column if not exists approved_at timestamptz null,
  add column if not exists updated_by text null;

alter table public.mi_cml_thickness_readings
  add column if not exists normalized_thickness_value numeric(12,4) null,
  add column if not exists measurement_point_label text null,
  add column if not exists scan_direction text null,
  add column if not exists temperature_condition text null,
  add column if not exists previous_thickness_value numeric(12,4) null,
  add column if not exists previous_reading_date date null,
  add column if not exists reading_source text not null default 'manual',
  add column if not exists inspector_name text null,
  add column if not exists attachment_document_id text null,
  add column if not exists reviewed_by text null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists rejected_reason text null;

alter table public.mi_cml_alerts
  add column if not exists source_reading_id text null,
  add column if not exists source_calculation_id text null;

alter table public.mi_cml_import_jobs
  add column if not exists uploaded_by text null,
  add column if not exists file_key text null,
  add column if not exists created_count integer not null default 0,
  add column if not exists updated_count integer not null default 0,
  add column if not exists skipped_count integer not null default 0,
  add column if not exists error_report_key text null;

alter table public.mi_cml_import_rows
  add column if not exists raw_data_json jsonb null,
  add column if not exists normalized_data_json jsonb null,
  add column if not exists validation_errors_json jsonb null,
  add column if not exists updated_record_id text null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.mi_equipment_technical_data_revisions
  add column if not exists moc_suggested boolean not null default false,
  add column if not exists linked_moc_id text null,
  add column if not exists changed_by text null,
  add column if not exists changed_at timestamptz null;

create index if not exists mi_cmls_next_due_date_idx on public.mi_cmls (next_due_date);
create index if not exists mi_cmls_component_type_idx on public.mi_cmls (component_type);
create index if not exists mi_cml_snapshots_alert_state_idx on public.mi_cml_calculation_snapshots (alert_state);
create index if not exists mi_cml_snapshots_final_next_due_idx on public.mi_cml_calculation_snapshots (final_next_due_date);
create index if not exists mi_cml_alerts_cml_status_idx on public.mi_cml_alerts (cml_id, status);
