create table if not exists public.psi_safe_operating_limits (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  area_id text null,
  equipment_id text null,
  limit_title text not null,
  system_service text null,
  parameter_name text not null,
  parameter_tag text null,
  parameter_type text not null,
  limit_scope text not null,
  criticality text not null,
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  operating_mode text null,
  status text not null default 'Draft',
  parameter_description text null,
  measurement_location text null,
  instrument_tag text null,
  dcs_plc_tag text null,
  analyzer_tag text null,
  data_source text null,
  unit_of_measure text not null,
  monitoring_frequency text null,
  controlled_variable boolean not null default false,
  manipulated_variable text null,
  related_process_chemistry_id text null,
  related_chemical_id text null,
  related_equipment_design_basis_id text null,
  related_relief_system_id text null,
  related_procedure_document_id text null,
  related_drawing_document_id text null,
  completeness_status text not null default 'Not Reviewed',
  completeness_score integer null,
  conflict_status text not null default 'Not Reviewed',
  review_status text not null default 'Not Reviewed',
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  owner_user_id text null,
  process_engineer_id text null,
  operations_owner_id text null,
  hse_reviewer_id text null,
  last_review_date date null,
  next_review_due date null,
  archive_reason text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null
);

create table if not exists public.psi_safe_operating_limit_values (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  normal_min numeric null,
  normal_max numeric null,
  normal_target numeric null,
  normal_range_basis text null,
  low_alert numeric null,
  high_alert numeric null,
  low_alarm numeric null,
  high_alarm numeric null,
  low_low_alarm numeric null,
  high_high_alarm numeric null,
  low_trip numeric null,
  high_trip numeric null,
  low_low_trip numeric null,
  high_high_trip numeric null,
  sif_interlock_setpoint numeric null,
  safe_state text null,
  trip_reset_requirement text null,
  min_design_limit numeric null,
  max_design_limit numeric null,
  min_safe_limit numeric null,
  max_safe_limit numeric null,
  mawp_mop_reference text null,
  design_temperature_reference text null,
  relief_set_pressure_reference text null,
  mechanical_limit_reference text null,
  environmental_compliance_limit_reference text null,
  unit_of_measure text not null,
  basis_reference text null,
  source_document_id text null,
  engineering_calculation_reference text null,
  confidence_level text null,
  data_quality_status text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, limit_id)
);

create table if not exists public.psi_limit_deviation_consequences (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  deviation_direction text not null,
  deviation_description text not null,
  process_consequence text null,
  safety_consequence text null,
  environmental_consequence text null,
  quality_consequence text null,
  equipment_integrity_consequence text null,
  overpressure_consequence text null,
  reaction_hazard_consequence text null,
  toxic_release_consequence text null,
  fire_explosion_consequence text null,
  severity text not null,
  time_to_consequence text null,
  detectability text null,
  related_unwanted_reaction_scenario_id text null,
  related_hazop_deviation_id text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_limit_operator_responses (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  deviation_consequence_id text null references public.psi_limit_deviation_consequences(id) on delete set null,
  required_operator_action text not null,
  response_time_requirement text null,
  initial_action text null,
  follow_up_action text null,
  escalation_requirement text null,
  shutdown_requirement text null,
  emergency_response_requirement text null,
  required_notification text null,
  related_sop_document_id text null,
  related_emergency_procedure_id text null,
  required_ppe text null,
  training_requirement_foundation text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_limit_controls_safeguards (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  control_type text not null,
  linked_module text null,
  linked_record_id text null,
  control_description text not null,
  setpoint text null,
  safe_state text null,
  required_response text null,
  reliability_criticality text null,
  test_proof_inspection_requirement text null,
  owner_user_id text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_limit_document_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  document_id text not null,
  document_type text not null,
  relationship_type text not null default 'Reference',
  required boolean not null default false,
  readiness_impact boolean not null default false,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.psi_limit_conflict_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  conflict_type text not null,
  conflict_status text not null,
  severity text not null,
  message text not null,
  compared_module text null,
  compared_record_id text null,
  compared_value_json jsonb null,
  current_value_json jsonb null,
  override_required boolean not null default false,
  override_approved boolean not null default false,
  override_reason text null,
  override_approved_by text null,
  override_approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_limit_completeness_evaluations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  unit_id text not null,
  check_key text not null,
  check_title text not null,
  status text not null,
  severity text not null,
  message text null,
  missing_reason text null,
  pssr_blocker boolean not null default false,
  action_required boolean not null default false,
  owner_user_id text null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, limit_id, check_key)
);

create table if not exists public.psi_limit_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null,
  equipment_id text null,
  limit_id text not null references public.psi_safe_operating_limits(id) on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'PSI Safe Operating Limits',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_limit_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  uploaded_by text null,
  file_name text not null,
  file_key text null,
  status text not null default 'Preview Ready',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  preview_json jsonb null,
  error_report_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_psi_sol_scope on public.psi_safe_operating_limits(company_id, site_id, unit_id);
create index if not exists idx_psi_sol_equipment on public.psi_safe_operating_limits(equipment_id);
create index if not exists idx_psi_sol_parameter_name on public.psi_safe_operating_limits(parameter_name);
create index if not exists idx_psi_sol_parameter_tag on public.psi_safe_operating_limits(parameter_tag);
create index if not exists idx_psi_sol_criticality on public.psi_safe_operating_limits(criticality);
create index if not exists idx_psi_sol_pssr on public.psi_safe_operating_limits(pssr_blocker);
create index if not exists idx_psi_sol_moc on public.psi_safe_operating_limits(moc_update_required);
create index if not exists idx_psi_sol_values_limit on public.psi_safe_operating_limit_values(limit_id);
create index if not exists idx_psi_sol_consequence_limit_severity on public.psi_limit_deviation_consequences(limit_id, severity);
create index if not exists idx_psi_sol_conflict_limit_status on public.psi_limit_conflict_results(limit_id, conflict_status);
create index if not exists idx_psi_sol_history_limit_created on public.psi_limit_history_events(limit_id, created_at desc);

alter table public.psi_safe_operating_limits enable row level security;
alter table public.psi_safe_operating_limit_values enable row level security;
alter table public.psi_limit_deviation_consequences enable row level security;
alter table public.psi_limit_operator_responses enable row level security;
alter table public.psi_limit_controls_safeguards enable row level security;
alter table public.psi_limit_document_links enable row level security;
alter table public.psi_limit_conflict_results enable row level security;
alter table public.psi_limit_completeness_evaluations enable row level security;
alter table public.psi_limit_history_events enable row level security;
alter table public.psi_limit_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_safe_operating_limits',
    'psi_safe_operating_limit_values',
    'psi_limit_deviation_consequences',
    'psi_limit_operator_responses',
    'psi_limit_controls_safeguards',
    'psi_limit_document_links',
    'psi_limit_conflict_results',
    'psi_limit_completeness_evaluations',
    'psi_limit_history_events',
    'psi_limit_import_jobs'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;

do $$
declare
  permission_key text;
  permission_label text;
begin
  for permission_key, permission_label in
    select * from (values
      ('psi.safe_limit.view', 'View PSI safe operating limits'),
      ('psi.safe_limit.create', 'Create PSI safe operating limits'),
      ('psi.safe_limit.edit', 'Edit PSI safe operating limits'),
      ('psi.safe_limit.archive', 'Archive PSI safe operating limits'),
      ('psi.safe_limit.import', 'Import PSI safe operating limits'),
      ('psi.safe_limit.export', 'Export PSI safe operating limits'),
      ('psi.safe_limit.manage_values', 'Manage PSI safe operating limit values'),
      ('psi.safe_limit.manage_consequences', 'Manage PSI safe operating limit consequences'),
      ('psi.safe_limit.manage_operator_response', 'Manage PSI safe operating limit operator response'),
      ('psi.safe_limit.manage_safeguards', 'Manage PSI safe operating limit safeguards'),
      ('psi.safe_limit.link_document', 'Link documents to PSI safe operating limits'),
      ('psi.safe_limit.remove_document', 'Remove documents from PSI safe operating limits'),
      ('psi.safe_limit.run_completeness_check', 'Run PSI safe operating limit completeness checks'),
      ('psi.safe_limit.run_conflict_check', 'Run PSI safe operating limit conflict checks'),
      ('psi.safe_limit.submit_review', 'Submit PSI safe operating limits for review'),
      ('psi.safe_limit.approve', 'Approve PSI safe operating limits'),
      ('psi.safe_limit.reject', 'Reject PSI safe operating limits'),
      ('psi.safe_limit.override_conflict', 'Override PSI safe operating limit conflicts')
    ) as permissions(key, label)
  loop
    insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
    select gen_random_uuid()::text, t.id, permission_key, 'PSI', permission_label
    from public."Tenant" t
    where not exists (
      select 1 from public."Permission" p
      where p."tenantId" = t.id and p."key" = permission_key
    );
  end loop;
end $$;
