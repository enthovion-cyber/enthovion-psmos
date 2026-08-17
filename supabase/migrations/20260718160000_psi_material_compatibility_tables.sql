create table if not exists public.psi_material_compatibility (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null,
  area_id text null,
  equipment_id text null,
  chemical_id text null,
  compatibility_title text not null,
  component_type text not null,
  system_service text null,
  compatibility_scope text not null,
  criticality text not null default 'Medium',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  compatibility_status text not null default 'Draft',
  compatibility_rating text not null default 'Unknown / Needs Data',
  rating_confidence text null,
  completeness_status text not null default 'Not Reviewed',
  completeness_score integer null,
  conflict_status text not null default 'Not Checked',
  review_status text not null default 'Draft',
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  mi_readiness_impact boolean not null default false,
  owner_user_id text null,
  process_engineer_id text null,
  materials_engineer_id text null,
  mechanical_mi_engineer_id text null,
  operations_owner_id text null,
  hse_reviewer_id text null,
  last_review_date timestamptz null,
  next_review_due timestamptz null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null
);

create table if not exists public.psi_material_compatibility_service_conditions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  chemical_name text not null,
  cas_number text null,
  is_mixture boolean not null default false,
  mixture_composition_summary text null,
  chemical_role text null,
  service_type text null,
  normal_concentration numeric null,
  min_concentration numeric null,
  max_concentration numeric null,
  concentration_unit text null,
  normal_temperature numeric null,
  min_temperature numeric null,
  max_temperature numeric null,
  temperature_unit text null,
  normal_pressure numeric null,
  min_pressure numeric null,
  max_pressure numeric null,
  pressure_unit text null,
  ph_normal numeric null,
  ph_min numeric null,
  ph_max numeric null,
  exposure_type text null,
  exposure_duration text null,
  flow_condition text null,
  velocity numeric null,
  solids_slurry_present boolean not null default false,
  water_moisture_present boolean not null default false,
  oxygen_air_present boolean not null default false,
  chlorides_present boolean not null default false,
  h2s_sour_service boolean not null default false,
  co2_service boolean not null default false,
  caustic_service boolean not null default false,
  acid_service boolean not null default false,
  oxidizer_service boolean not null default false,
  cleaning_flushing_chemical boolean not null default false,
  temporary_service boolean not null default false,
  abnormal_emergency_service boolean not null default false,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_material_compatibility_material_details (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  material_family text not null,
  material_grade text null,
  material_specification text null,
  material_code text null,
  material_source text null,
  equipment_design_basis_id text null,
  mi_technical_data_id text null,
  component_type text not null,
  component_description text null,
  wetted_part boolean not null default true,
  gasket_seal_elastomer_type text null,
  lining_coating_type text null,
  coating_thickness numeric null,
  lining_thickness numeric null,
  material_thickness numeric null,
  corrosion_allowance numeric null,
  heat_treatment_condition text null,
  surface_finish text null,
  weld_material_filler text null,
  cladding_overlay text null,
  manufacturer_vendor text null,
  certificate_document_id text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_material_compatibility_ratings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  compatibility_rating text not null,
  rating_confidence text not null default 'Unknown',
  compatibility_basis text not null,
  suitable_temperature_min numeric null,
  suitable_temperature_max numeric null,
  suitable_temperature_unit text null,
  suitable_concentration_min numeric null,
  suitable_concentration_max numeric null,
  suitable_concentration_unit text null,
  suitable_ph_min numeric null,
  suitable_ph_max numeric null,
  suitable_pressure_min numeric null,
  suitable_pressure_max numeric null,
  suitable_pressure_unit text null,
  maximum_velocity numeric null,
  exposure_duration_limitation text null,
  required_inhibitor text null,
  required_lining_coating text null,
  required_inspection_frequency text null,
  required_operating_restriction text null,
  engineering_review_required boolean not null default false,
  approved_exception boolean not null default false,
  exception_reason text null,
  exception_approved_by text null,
  exception_approved_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_material_degradation_mechanisms (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  mechanism_type text not null,
  risk_level text not null default 'Unknown',
  trigger_conditions text null,
  affected_component text null,
  expected_damage_mode text null,
  consequence text null,
  detection_method text null,
  monitoring_requirement text null,
  inspection_requirement text null,
  mitigation text null,
  related_mi_damage_mechanism_id text null,
  related_cml_tml_foundation text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_material_compatibility_controls (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  operating_restriction text null,
  temperature_restriction text null,
  concentration_restriction text null,
  ph_restriction text null,
  pressure_restriction text null,
  exposure_duration_restriction text null,
  inhibitor_requirement text null,
  coating_lining_requirement text null,
  material_upgrade_required boolean not null default false,
  inspection_frequency_requirement text null,
  cml_tml_monitoring_requirement text null,
  corrosion_coupon_probe_requirement text null,
  sampling_analysis_requirement text null,
  cleaning_flushing_control text null,
  storage_segregation_requirement text null,
  ptw_restriction text null,
  ppe_note text null,
  emergency_response_note text null,
  training_requirement_foundation text null,
  required_action text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_material_compatibility_document_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  document_id text not null,
  document_type text not null,
  relationship_type text not null default 'Evidence',
  required boolean not null default false,
  readiness_impact boolean not null default false,
  document_number text null,
  document_title text null,
  document_status text null,
  revision_number text null,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.psi_material_compatibility_conflict_results (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  equipment_id text null,
  chemical_id text null,
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

create table if not exists public.psi_material_compatibility_completeness_evaluations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  compatibility_id text not null references public.psi_material_compatibility(id) on delete cascade,
  unit_id text not null,
  equipment_id text null,
  chemical_id text null,
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
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_material_compatibility_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text null,
  equipment_id text null,
  chemical_id text null,
  compatibility_id text null references public.psi_material_compatibility(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'PSI Material Compatibility',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_material_compatibility_import_jobs (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  uploaded_by text null,
  file_name text not null,
  file_key text null,
  status text not null default 'Preview',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_report_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_psi_material_compatibility_company_site_unit on public.psi_material_compatibility(company_id, site_id, unit_id);
create index if not exists idx_psi_material_compatibility_equipment on public.psi_material_compatibility(equipment_id);
create index if not exists idx_psi_material_compatibility_chemical on public.psi_material_compatibility(chemical_id);
create index if not exists idx_psi_material_compatibility_rating on public.psi_material_compatibility(compatibility_rating);
create index if not exists idx_psi_material_compatibility_pssr on public.psi_material_compatibility(pssr_blocker);
create index if not exists idx_psi_material_compatibility_mi on public.psi_material_compatibility(mi_readiness_impact);
create index if not exists idx_psi_material_compatibility_moc on public.psi_material_compatibility(moc_update_required);
create unique index if not exists uq_psi_material_service_conditions_compatibility on public.psi_material_compatibility_service_conditions(compatibility_id);
create unique index if not exists uq_psi_material_details_compatibility on public.psi_material_compatibility_material_details(compatibility_id);
create unique index if not exists uq_psi_material_ratings_compatibility on public.psi_material_compatibility_ratings(compatibility_id);
create unique index if not exists uq_psi_material_controls_compatibility on public.psi_material_compatibility_controls(compatibility_id);
create index if not exists idx_psi_material_details_family on public.psi_material_compatibility_material_details(compatibility_id, material_family);
create index if not exists idx_psi_material_degradation_mechanisms_type on public.psi_material_degradation_mechanisms(compatibility_id, mechanism_type);
create index if not exists idx_psi_material_conflicts_status on public.psi_material_compatibility_conflict_results(compatibility_id, conflict_status);
create index if not exists idx_psi_material_history_created on public.psi_material_compatibility_history_events(compatibility_id, created_at desc);

alter table public.psi_material_compatibility enable row level security;
alter table public.psi_material_compatibility_service_conditions enable row level security;
alter table public.psi_material_compatibility_material_details enable row level security;
alter table public.psi_material_compatibility_ratings enable row level security;
alter table public.psi_material_degradation_mechanisms enable row level security;
alter table public.psi_material_compatibility_controls enable row level security;
alter table public.psi_material_compatibility_document_links enable row level security;
alter table public.psi_material_compatibility_conflict_results enable row level security;
alter table public.psi_material_compatibility_completeness_evaluations enable row level security;
alter table public.psi_material_compatibility_history_events enable row level security;
alter table public.psi_material_compatibility_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_material_compatibility',
    'psi_material_compatibility_service_conditions',
    'psi_material_compatibility_material_details',
    'psi_material_compatibility_ratings',
    'psi_material_degradation_mechanisms',
    'psi_material_compatibility_controls',
    'psi_material_compatibility_document_links',
    'psi_material_compatibility_conflict_results',
    'psi_material_compatibility_completeness_evaluations',
    'psi_material_compatibility_history_events',
    'psi_material_compatibility_import_jobs'
  ]
  loop
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
      ('psi.material_compatibility.view', 'View PSI Material Compatibility'),
      ('psi.material_compatibility.create', 'Create PSI Material Compatibility'),
      ('psi.material_compatibility.edit', 'Edit PSI Material Compatibility'),
      ('psi.material_compatibility.archive', 'Archive PSI Material Compatibility'),
      ('psi.material_compatibility.import', 'Import PSI Material Compatibility'),
      ('psi.material_compatibility.export', 'Export PSI Material Compatibility'),
      ('psi.material_compatibility.manage_service_conditions', 'Manage PSI Material Service Conditions'),
      ('psi.material_compatibility.manage_material_details', 'Manage PSI Material Details'),
      ('psi.material_compatibility.manage_rating', 'Manage PSI Material Compatibility Rating'),
      ('psi.material_compatibility.manage_degradation_mechanisms', 'Manage PSI Material Degradation Mechanisms'),
      ('psi.material_compatibility.manage_controls', 'Manage PSI Material Controls'),
      ('psi.material_compatibility.link_document', 'Link PSI Material Compatibility Documents'),
      ('psi.material_compatibility.remove_document', 'Remove PSI Material Compatibility Documents'),
      ('psi.material_compatibility.run_compatibility_check', 'Run PSI Material Compatibility Check'),
      ('psi.material_compatibility.run_completeness_check', 'Run PSI Material Completeness Check'),
      ('psi.material_compatibility.run_conflict_check', 'Run PSI Material Conflict Check'),
      ('psi.material_compatibility.submit_review', 'Submit PSI Material Compatibility Review'),
      ('psi.material_compatibility.approve', 'Approve PSI Material Compatibility'),
      ('psi.material_compatibility.reject', 'Reject PSI Material Compatibility'),
      ('psi.material_compatibility.override_conflict', 'Override PSI Material Compatibility Conflict')
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
