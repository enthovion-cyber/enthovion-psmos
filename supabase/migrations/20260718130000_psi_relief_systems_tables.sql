create table if not exists public.psi_relief_systems (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null,
  area_id text null,
  protected_equipment_id text not null,
  protected_equipment_tag text not null,
  relief_basis_title text not null,
  relief_system_type text not null,
  system_service text null,
  criticality text not null default 'Medium',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  status text not null default 'Draft',
  completeness_status text not null default 'Not Reviewed',
  completeness_score numeric null,
  conflict_status text not null default 'No Conflict',
  review_status text not null default 'Not Reviewed',
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  mi_readiness_impact boolean not null default false,
  owner_user_id text null,
  process_engineer_id text null,
  mechanical_engineer_id text null,
  relief_engineer_id text null,
  mi_owner_id text null,
  operations_owner_id text null,
  hse_reviewer_id text null,
  last_review_date timestamptz null,
  next_review_due timestamptz null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.psi_relief_protected_equipment (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  equipment_id text not null,
  equipment_tag text not null,
  equipment_name text null,
  equipment_type text null,
  equipment_design_basis_id text null,
  mawp numeric null,
  mop numeric null,
  design_pressure numeric null,
  design_temperature numeric null,
  normal_operating_pressure numeric null,
  normal_operating_temperature numeric null,
  max_safe_operating_pressure numeric null,
  max_safe_operating_temperature numeric null,
  service_fluid text null,
  fluid_phase text null,
  maximum_intended_inventory numeric null,
  volume_capacity numeric null,
  material_of_construction text null,
  corrosive_service boolean not null default false,
  toxic_service boolean not null default false,
  flammable_service boolean not null default false,
  reactive_service boolean not null default false,
  equipment_isolation_note text null,
  protected_system_boundary text null,
  connected_equipment_json jsonb null,
  pid_document_id text null,
  design_basis_document_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_relief_protected_equipment_one unique (company_id, relief_system_id)
);

create table if not exists public.psi_relief_device_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  mi_relief_device_id text null,
  relief_device_tag text not null,
  relief_device_type text not null,
  set_pressure numeric null,
  set_pressure_unit text null,
  rated_capacity numeric null,
  rated_capacity_unit text null,
  orifice_designation text null,
  inlet_size text null,
  outlet_size text null,
  manufacturer text null,
  model text null,
  serial_number text null,
  installation_location text null,
  protected_equipment_relationship text null,
  mi_device_status text null,
  mi_last_test_date timestamptz null,
  mi_next_test_due timestamptz null,
  mi_certificate_status text null,
  mi_seal_status text null,
  mi_impairment_status text null,
  device_notes text null,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.psi_relief_scenarios (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  unit_id text not null,
  protected_equipment_id text not null,
  scenario_title text not null,
  scenario_type text not null,
  scenario_description text null,
  cause_initiating_event text null,
  involved_chemicals_json jsonb null,
  fluid_phase text null,
  relieving_fluid text null,
  relieving_temperature numeric null,
  relieving_pressure numeric null,
  required_relief_rate numeric null,
  required_relief_rate_unit text null,
  required_vapor_rate numeric null,
  required_liquid_rate numeric null,
  two_phase_flow boolean not null default false,
  governing_case boolean not null default false,
  calculation_method_basis text null,
  assumptions text null,
  existing_safeguards text null,
  related_process_chemistry_scenario_id text null,
  related_safe_operating_limit_id text null,
  related_hazop_deviation_id text null,
  related_lopa_scenario_id text null,
  related_moc_id text null,
  consequence_if_not_relieved text null,
  scenario_severity text null,
  calculation_document_id text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_relief_sizing_capacity_basis (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  governing_scenario_id text null,
  required_relief_rate numeric null,
  required_relief_rate_unit text null,
  rated_relief_capacity numeric null,
  rated_capacity_unit text null,
  capacity_margin numeric null,
  relieving_pressure numeric null,
  relieving_temperature numeric null,
  set_pressure numeric null,
  accumulation_basis text null,
  backpressure_basis text null,
  inlet_pressure_drop_basis text null,
  outlet_pressure_drop_basis text null,
  relief_fluid_phase text null,
  molecular_weight_density_note text null,
  compressibility_vapor_liquid_note text null,
  two_phase_flow_basis text null,
  fire_wetted_area_basis text null,
  heat_input_basis text null,
  orifice_vent_area text null,
  sizing_method text null,
  calculation_reference text null,
  calculation_status text not null default 'Not Started',
  independent_verification_status text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_relief_sizing_one unique (company_id, relief_system_id)
);

create table if not exists public.psi_relief_discharge_destinations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  relief_destination_type text null,
  destination_system text null,
  flare_header text null,
  scrubber text null,
  vent_stack text null,
  atmosphere_location text null,
  closed_drain text null,
  blowdown_system text null,
  containment text null,
  safe_location_assessment text null,
  toxic_release_concern boolean not null default false,
  flammable_release_concern boolean not null default false,
  environmental_release_concern boolean not null default false,
  noise_concern boolean not null default false,
  thermal_radiation_concern boolean not null default false,
  backpressure_source text null,
  disposal_treatment_basis text null,
  downstream_system_capacity text null,
  isolation_car_seal_requirements text null,
  discharge_piping_notes text null,
  discharge_pid_document_id text null,
  flare_study_document_id text null,
  environmental_permit_document_id text null,
  emergency_response_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_relief_discharge_one unique (company_id, relief_system_id)
);

create table if not exists public.psi_relief_document_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  document_id text not null,
  document_number text null,
  document_title text null,
  document_status text null,
  document_revision text null,
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

create table if not exists public.psi_relief_conflict_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  protected_equipment_id text null,
  conflict_type text not null,
  conflict_status text not null,
  severity text not null default 'Medium',
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

create table if not exists public.psi_relief_completeness_evaluations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  unit_id text not null,
  protected_equipment_id text null,
  check_key text not null,
  check_title text not null,
  status text not null,
  severity text not null default 'Medium',
  message text null,
  missing_reason text null,
  pssr_blocker boolean not null default false,
  mi_readiness_impact boolean not null default false,
  action_required boolean not null default false,
  owner_user_id text null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_relief_mi_sync_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  mi_relief_device_id text null,
  sync_direction text not null,
  source_module text not null,
  target_module text not null,
  status text not null,
  field_diff_json jsonb null,
  applied_changes_json jsonb null,
  skipped_changes_json jsonb null,
  sync_reason text null,
  synced_by text null,
  synced_at timestamptz not null default now()
);

create table if not exists public.psi_relief_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null,
  protected_equipment_id text null,
  relief_system_id text not null references public.psi_relief_systems(id) on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'PSI Relief Systems',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_relief_import_jobs (
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
  error_report_key text null,
  preview_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.psi_relief_systems enable row level security;
alter table public.psi_relief_protected_equipment enable row level security;
alter table public.psi_relief_device_links enable row level security;
alter table public.psi_relief_scenarios enable row level security;
alter table public.psi_relief_sizing_capacity_basis enable row level security;
alter table public.psi_relief_discharge_destinations enable row level security;
alter table public.psi_relief_document_links enable row level security;
alter table public.psi_relief_conflict_results enable row level security;
alter table public.psi_relief_completeness_evaluations enable row level security;
alter table public.psi_relief_mi_sync_events enable row level security;
alter table public.psi_relief_history_events enable row level security;
alter table public.psi_relief_import_jobs enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'psi_relief_systems','psi_relief_protected_equipment','psi_relief_device_links','psi_relief_scenarios',
    'psi_relief_sizing_capacity_basis','psi_relief_discharge_destinations','psi_relief_document_links',
    'psi_relief_conflict_results','psi_relief_completeness_evaluations','psi_relief_mi_sync_events',
    'psi_relief_history_events','psi_relief_import_jobs'
  ] loop
    execute format('drop policy if exists %I_service_role_all on public.%I', table_name, table_name);
    execute format('create policy %I_service_role_all on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', table_name, table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end $$;

create index if not exists psi_relief_systems_company_site_unit_idx on public.psi_relief_systems(company_id, site_id, unit_id);
create unique index if not exists psi_relief_systems_one_active_equipment_idx on public.psi_relief_systems(company_id, unit_id, protected_equipment_id) where archived_at is null;
create index if not exists psi_relief_systems_equipment_idx on public.psi_relief_systems(protected_equipment_id);
create index if not exists psi_relief_systems_type_idx on public.psi_relief_systems(relief_system_type);
create index if not exists psi_relief_systems_criticality_idx on public.psi_relief_systems(criticality);
create index if not exists psi_relief_systems_pssr_idx on public.psi_relief_systems(pssr_blocker);
create index if not exists psi_relief_systems_moc_idx on public.psi_relief_systems(moc_update_required);
create index if not exists psi_relief_device_links_system_idx on public.psi_relief_device_links(relief_system_id);
create index if not exists psi_relief_device_links_mi_idx on public.psi_relief_device_links(mi_relief_device_id);
create index if not exists psi_relief_scenarios_system_governing_idx on public.psi_relief_scenarios(relief_system_id, governing_case);
create index if not exists psi_relief_scenarios_type_idx on public.psi_relief_scenarios(scenario_type);
create index if not exists psi_relief_conflicts_system_status_idx on public.psi_relief_conflict_results(relief_system_id, conflict_status);
create index if not exists psi_relief_history_system_created_idx on public.psi_relief_history_events(relief_system_id, created_at desc);

do $$
declare
  tenant_id text;
  permission_key text;
  permission_label text;
begin
  for tenant_id in select id from public."Tenant" loop
    for permission_key, permission_label in
      values
      ('psi.relief_system.view', 'View PSI relief systems'),
      ('psi.relief_system.create', 'Create PSI relief systems'),
      ('psi.relief_system.edit', 'Edit PSI relief systems'),
      ('psi.relief_system.archive', 'Archive PSI relief systems'),
      ('psi.relief_system.import', 'Import PSI relief systems'),
      ('psi.relief_system.export', 'Export PSI relief systems'),
      ('psi.relief_system.manage_protected_equipment', 'Manage protected equipment relief basis'),
      ('psi.relief_system.link_device', 'Link MI relief devices'),
      ('psi.relief_system.remove_device', 'Remove MI relief device links'),
      ('psi.relief_system.manage_scenarios', 'Manage relief scenarios'),
      ('psi.relief_system.manage_sizing_basis', 'Manage relief sizing basis'),
      ('psi.relief_system.manage_discharge_destination', 'Manage relief discharge destination'),
      ('psi.relief_system.link_document', 'Link relief documents'),
      ('psi.relief_system.remove_document', 'Remove relief documents'),
      ('psi.relief_system.sync_mi', 'Sync relief basis with MI'),
      ('psi.relief_system.run_completeness_check', 'Run relief completeness check'),
      ('psi.relief_system.run_conflict_check', 'Run relief conflict check'),
      ('psi.relief_system.submit_review', 'Submit relief basis review'),
      ('psi.relief_system.approve', 'Approve relief basis'),
      ('psi.relief_system.reject', 'Reject relief basis'),
      ('psi.relief_system.override_conflict', 'Override relief conflict')
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'PSI', permission_label
      where not exists (select 1 from public."Permission" where "tenantId" = tenant_id and "key" = permission_key);
    end loop;
  end loop;
end $$;
