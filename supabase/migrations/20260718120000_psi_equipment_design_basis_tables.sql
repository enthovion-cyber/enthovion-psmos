create table if not exists public.psi_equipment_design_basis (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  area_id text null,
  equipment_id text not null,
  equipment_tag text not null,
  equipment_name text not null,
  equipment_type text not null,
  equipment_category text null,
  system_service text null,
  equipment_criticality text not null,
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  status text not null default 'Draft',
  service_fluid text null,
  fluid_phase text null,
  completeness_status text not null default 'Not Reviewed',
  completeness_score integer null,
  conflict_status text not null default 'Not Reviewed',
  review_status text not null default 'Not Reviewed',
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  mi_readiness_impact boolean not null default false,
  owner_user_id text null,
  process_engineer_id text null,
  mechanical_engineer_id text null,
  mi_owner_id text null,
  operations_owner_id text null,
  hse_reviewer_id text null,
  last_review_date date null,
  next_review_due date null,
  notes text null,
  archive_reason text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  constraint psi_equipment_design_active_unique unique (company_id, unit_id, equipment_id, archived_at)
);

create table if not exists public.psi_equipment_design_ratings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  design_pressure numeric null,
  design_pressure_unit text null,
  mawp numeric null,
  mawp_unit text null,
  mop numeric null,
  mop_unit text null,
  vacuum_design_pressure numeric null,
  hydrotest_pressure numeric null,
  pneumatic_test_pressure numeric null,
  relief_set_pressure_reference text null,
  pressure_rating_basis text null,
  min_design_temperature numeric null,
  max_design_temperature numeric null,
  min_normal_operating_temperature numeric null,
  max_normal_operating_temperature numeric null,
  maximum_allowable_temperature numeric null,
  minimum_design_metal_temperature numeric null,
  temperature_unit text null,
  temperature_rating_basis text null,
  design_life_years numeric null,
  commissioning_date date null,
  remaining_design_life_foundation text null,
  design_margin_safety_factor text null,
  external_design_conditions text null,
  internal_design_conditions text null,
  cyclic_service boolean not null default false,
  fatigue_consideration boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, design_basis_id)
);

create table if not exists public.psi_equipment_service_basis (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  chemical_service text null,
  corrosive_service boolean not null default false,
  toxic_service boolean not null default false,
  flammable_service boolean not null default false,
  reactive_service boolean not null default false,
  two_phase_service boolean not null default false,
  slurry_solids_service boolean not null default false,
  fouling_service boolean not null default false,
  erosive_service boolean not null default false,
  hydrogen_service boolean not null default false,
  sour_service_h2s boolean not null default false,
  oxygen_service boolean not null default false,
  cryogenic_service boolean not null default false,
  high_temperature_service boolean not null default false,
  normal_operating_pressure numeric null,
  normal_operating_temperature numeric null,
  normal_flow numeric null,
  operating_envelope_summary text null,
  startup_shutdown_service_notes text null,
  cleaning_flushing_service_notes text null,
  abnormal_service_conditions text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, design_basis_id)
);

create table if not exists public.psi_equipment_material_basis (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  material_of_construction text null,
  shell_material text null,
  head_material text null,
  tube_material text null,
  internal_material text null,
  lining_coating text null,
  cladding text null,
  gasket_material text null,
  seal_material text null,
  elastomer_material text null,
  corrosion_allowance numeric null,
  corrosion_allowance_unit text null,
  nominal_thickness numeric null,
  minimum_required_thickness numeric null,
  thickness_unit text null,
  joint_efficiency text null,
  weld_category text null,
  insulation_type text null,
  fireproofing_requirement text null,
  external_coating text null,
  internal_coating text null,
  cathodic_protection text null,
  cui_susceptibility boolean not null default false,
  corrosion_mechanism text null,
  material_compatibility_notes text null,
  nde_requirement text null,
  inspection_requirement text null,
  special_metallurgy_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, design_basis_id)
);

create table if not exists public.psi_equipment_capacity_basis (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  design_capacity numeric null,
  capacity_unit text null,
  normal_capacity numeric null,
  turndown_limit text null,
  design_flow numeric null,
  normal_flow numeric null,
  minimum_flow numeric null,
  maximum_flow numeric null,
  flow_unit text null,
  pressure_drop numeric null,
  duty numeric null,
  duty_unit text null,
  efficiency numeric null,
  design_inventory_volume numeric null,
  normal_inventory_volume numeric null,
  maximum_intended_inventory numeric null,
  volume_unit text null,
  residence_time text null,
  performance_basis_notes text null,
  equipment_specific_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, design_basis_id)
);

create table if not exists public.psi_equipment_design_codes (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  design_code text null,
  code_edition text null,
  construction_code text null,
  inspection_code text null,
  relief_design_code_reference text null,
  electrical_instrument_standard_reference text null,
  company_standard text null,
  licensor_standard text null,
  vendor_standard text null,
  regulatory_requirement text null,
  certification_requirement text null,
  third_party_inspection_requirement text null,
  code_stamp_certification_number text null,
  design_registration_number text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, design_basis_id)
);

create table if not exists public.psi_equipment_design_assumptions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  original_design_assumptions text null,
  process_assumptions text null,
  mechanical_assumptions text null,
  utility_assumptions text null,
  environmental_assumptions text null,
  chemical_assumptions text null,
  corrosion_assumptions text null,
  operating_limitations text null,
  known_restrictions text null,
  temporary_restrictions text null,
  exclusions text null,
  design_basis_uncertainty text null,
  required_verification text null,
  required_future_study text null,
  engineering_notes text null,
  moc_required_on_change boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, design_basis_id)
);

create table if not exists public.psi_equipment_design_document_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
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
  remove_reason text null,
  unique(company_id, design_basis_id, document_id)
);

create table if not exists public.psi_equipment_design_conflict_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  equipment_id text not null,
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

create table if not exists public.psi_equipment_design_completeness_evaluations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  unit_id text not null,
  equipment_id text not null,
  check_key text not null,
  check_title text not null,
  status text not null,
  severity text not null,
  message text null,
  missing_reason text null,
  pssr_blocker boolean not null default false,
  mi_readiness_impact boolean not null default false,
  action_required boolean not null default false,
  owner_user_id text null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, design_basis_id, check_key)
);

create table if not exists public.psi_equipment_design_sync_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  equipment_id text not null,
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

create table if not exists public.psi_equipment_design_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null,
  equipment_id text not null,
  design_basis_id text not null references public.psi_equipment_design_basis(id) on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'PSI Equipment Design Basis',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_equipment_design_import_jobs (
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

alter table public.psi_equipment_design_basis enable row level security;
alter table public.psi_equipment_design_ratings enable row level security;
alter table public.psi_equipment_service_basis enable row level security;
alter table public.psi_equipment_material_basis enable row level security;
alter table public.psi_equipment_capacity_basis enable row level security;
alter table public.psi_equipment_design_codes enable row level security;
alter table public.psi_equipment_design_assumptions enable row level security;
alter table public.psi_equipment_design_document_links enable row level security;
alter table public.psi_equipment_design_conflict_results enable row level security;
alter table public.psi_equipment_design_completeness_evaluations enable row level security;
alter table public.psi_equipment_design_sync_events enable row level security;
alter table public.psi_equipment_design_history_events enable row level security;
alter table public.psi_equipment_design_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_equipment_design_basis',
    'psi_equipment_design_ratings',
    'psi_equipment_service_basis',
    'psi_equipment_material_basis',
    'psi_equipment_capacity_basis',
    'psi_equipment_design_codes',
    'psi_equipment_design_assumptions',
    'psi_equipment_design_document_links',
    'psi_equipment_design_conflict_results',
    'psi_equipment_design_completeness_evaluations',
    'psi_equipment_design_sync_events',
    'psi_equipment_design_history_events',
    'psi_equipment_design_import_jobs'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_service_role_all'
    ) then
      execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
    end if;
  end loop;
end $$;

create index if not exists psi_equipment_design_basis_company_site_unit_idx on public.psi_equipment_design_basis(company_id, site_id, unit_id);
create unique index if not exists psi_equipment_design_basis_one_active_equipment_idx on public.psi_equipment_design_basis(company_id, unit_id, equipment_id) where archived_at is null;
create index if not exists psi_equipment_design_basis_equipment_idx on public.psi_equipment_design_basis(equipment_id);
create index if not exists psi_equipment_design_basis_equipment_tag_idx on public.psi_equipment_design_basis(equipment_tag);
create index if not exists psi_equipment_design_basis_type_idx on public.psi_equipment_design_basis(equipment_type);
create index if not exists psi_equipment_design_basis_criticality_idx on public.psi_equipment_design_basis(equipment_criticality);
create index if not exists psi_equipment_design_basis_pssr_idx on public.psi_equipment_design_basis(pssr_blocker);
create index if not exists psi_equipment_design_basis_moc_idx on public.psi_equipment_design_basis(moc_update_required);
create index if not exists psi_equipment_design_ratings_basis_idx on public.psi_equipment_design_ratings(design_basis_id);
create index if not exists psi_equipment_material_basis_basis_idx on public.psi_equipment_material_basis(design_basis_id);
create index if not exists psi_equipment_design_conflicts_basis_status_idx on public.psi_equipment_design_conflict_results(design_basis_id, conflict_status);
create index if not exists psi_equipment_design_history_basis_created_idx on public.psi_equipment_design_history_events(design_basis_id, created_at desc);
create index if not exists psi_equipment_design_completeness_basis_status_idx on public.psi_equipment_design_completeness_evaluations(design_basis_id, status, severity);

do $$
declare
  permission_key text;
  permission_label text;
begin
  for permission_key, permission_label in
    select * from (values
      ('psi.equipment_design.view', 'View PSI equipment design basis'),
      ('psi.equipment_design.create', 'Create PSI equipment design basis'),
      ('psi.equipment_design.edit', 'Edit PSI equipment design basis'),
      ('psi.equipment_design.archive', 'Archive PSI equipment design basis'),
      ('psi.equipment_design.import', 'Import PSI equipment design basis'),
      ('psi.equipment_design.export', 'Export PSI equipment design basis'),
      ('psi.equipment_design.manage_ratings', 'Manage equipment design ratings'),
      ('psi.equipment_design.manage_service_basis', 'Manage equipment service basis'),
      ('psi.equipment_design.manage_material_basis', 'Manage equipment material basis'),
      ('psi.equipment_design.manage_capacity_basis', 'Manage equipment capacity basis'),
      ('psi.equipment_design.manage_codes', 'Manage equipment design codes'),
      ('psi.equipment_design.manage_assumptions', 'Manage equipment design assumptions'),
      ('psi.equipment_design.link_document', 'Link equipment design documents'),
      ('psi.equipment_design.remove_document', 'Remove equipment design documents'),
      ('psi.equipment_design.sync_mi', 'Sync equipment design with MI'),
      ('psi.equipment_design.run_completeness_check', 'Run equipment design completeness check'),
      ('psi.equipment_design.run_conflict_check', 'Run equipment design conflict check'),
      ('psi.equipment_design.submit_review', 'Submit equipment design basis review'),
      ('psi.equipment_design.approve', 'Approve equipment design basis'),
      ('psi.equipment_design.reject', 'Reject equipment design basis'),
      ('psi.equipment_design.override_conflict', 'Override equipment design conflict')
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
