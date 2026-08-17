create table if not exists public.psi_electrical_classifications (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null,
  area_id text null,
  classification_title text not null,
  classification_record_number text null,
  building_location text null,
  system_service text null,
  classification_system text not null,
  applicable_standard text null,
  classification_status text not null default 'Draft',
  critical_area boolean not null default false,
  psm_critical boolean not null default false,
  hot_work_restricted boolean not null default false,
  completeness_status text not null default 'Not Reviewed',
  completeness_score numeric null,
  conflict_status text not null default 'No Conflict',
  review_status text not null default 'Draft',
  rating_compliance_status text null,
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  owner_user_id text null,
  electrical_engineer_id text null,
  instrument_engineer_id text null,
  process_engineer_id text null,
  operations_owner_id text null,
  hse_reviewer_id text null,
  last_review_date timestamptz null,
  next_review_due timestamptz null,
  notes text null,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null
);

create table if not exists public.psi_electrical_hazard_sources (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  chemical_id text null,
  hazardous_material_name text not null,
  cas_number text null,
  material_type text not null,
  flash_point text null,
  autoignition_temperature text null,
  lel text null,
  uel text null,
  vapor_density text null,
  dust_explosibility_data text null,
  minimum_ignition_energy text null,
  temperature_class_basis text null,
  gas_group_basis text null,
  source_of_release text not null,
  release_source_type text not null,
  release_grade text not null,
  release_frequency text null,
  release_duration text null,
  release_pressure text null,
  release_temperature text null,
  release_rate_basis text null,
  process_condition_causing_release text null,
  normal_or_abnormal_release text null,
  related_process_chemistry_id text null,
  related_relief_system_id text null,
  related_equipment_id text null,
  related_drawing_id text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_area_classification_details (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  zone_classification text null,
  nec_class_division text null,
  gas_group text null,
  dust_group text null,
  temperature_class text null,
  equipment_protection_level text null,
  epl_required text null,
  ex_marking_requirement text null,
  zone_basis text null,
  class_division_basis text null,
  classified_area_boundary_description text null,
  hazard_radius text null,
  vertical_extent text null,
  horizontal_extent text null,
  nearby_openings_impact text null,
  drain_low_point_impact text null,
  ventilation_effect text null,
  weather_outdoor_effect text null,
  adjacent_area_classification text null,
  unclassified_area_justification text null,
  classification_assumptions text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_electrical_ventilation_basis (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  ventilation_type text not null,
  ventilation_availability text null,
  ventilation_effectiveness text null,
  indoor_outdoor text null,
  natural_ventilation_basis text null,
  mechanical_ventilation_basis text null,
  air_changes_per_hour text null,
  ventilation_reliability text null,
  ventilation_failure_impact text null,
  enclosure_building_details text null,
  gas_detector_coverage_foundation text null,
  drainage_low_point_accumulation_concern boolean not null default false,
  release_dispersion_assumption text null,
  extent_calculation_method text null,
  extent_drawing_document_id text null,
  ventilation_study_document_id text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_electrical_protection_requirements (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  required_protection_method text not null,
  required_ex_marking text null,
  required_epl text null,
  required_ip_rating text null,
  required_temperature_class text null,
  required_gas_dust_group text null,
  intrinsic_safety_required boolean not null default false,
  explosion_proof_required boolean not null default false,
  increased_safety_required boolean not null default false,
  pressurization_purging_required boolean not null default false,
  non_sparking_required boolean not null default false,
  dust_protection_required boolean not null default false,
  cable_gland_requirement text null,
  earthing_bonding_requirement text null,
  static_control_requirement text null,
  hot_surface_temperature_control text null,
  portable_equipment_restrictions text null,
  temporary_equipment_restrictions text null,
  inspection_frequency_foundation text null,
  maintenance_requirements_foundation text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_electrical_installed_equipment (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  equipment_id text null,
  instrument_id text null,
  tag_number text not null,
  item_type text not null,
  location text null,
  installed_ex_marking text null,
  installed_epl text null,
  installed_gas_dust_group text null,
  installed_temperature_class text null,
  ip_rating text null,
  certification_document_id text null,
  certificate_number text null,
  manufacturer text null,
  model text null,
  inspection_status_foundation text null,
  suitability_result text not null default 'Needs Review',
  mismatch_reason text null,
  action_required boolean not null default false,
  notes text null,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz null,
  removed_by text null
);

create table if not exists public.psi_electrical_document_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  document_id text not null,
  document_type text not null,
  relationship_type text not null,
  required boolean not null default false,
  readiness_impact boolean not null default false,
  document_number text null,
  document_title text null,
  document_status text null,
  revision_number text null,
  linked_by text not null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.psi_electrical_ptw_controls (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  hot_work_restricted boolean not null default false,
  hot_work_permit_required boolean not null default false,
  gas_test_required boolean not null default false,
  continuous_gas_monitoring_required boolean not null default false,
  isolation_required boolean not null default false,
  temporary_electrical_equipment_restriction text null,
  portable_device_restriction text null,
  non_ex_equipment_prohibited boolean not null default false,
  bonding_earthing_requirement text null,
  static_control_requirement text null,
  vehicle_mobile_equipment_restriction text null,
  opening_drain_vent_restriction text null,
  required_ppe text null,
  emergency_response_note text null,
  ptw_hazard_note text null,
  loto_electrical_isolation_note text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_electrical_completeness_evaluations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
  unit_id text not null,
  area_id text null,
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
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_electrical_conflict_results (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  classification_id text not null references public.psi_electrical_classifications(id) on delete cascade,
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

create table if not exists public.psi_electrical_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text null,
  area_id text null,
  classification_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text not null,
  source_module text not null default 'PSI Electrical Classification',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_electrical_import_jobs (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  uploaded_by text not null,
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

create index if not exists idx_psi_electrical_classifications_company_site_unit on public.psi_electrical_classifications(company_id, site_id, unit_id);
create index if not exists idx_psi_electrical_classifications_area on public.psi_electrical_classifications(area_id);
create index if not exists idx_psi_electrical_classifications_system on public.psi_electrical_classifications(classification_system);
create index if not exists idx_psi_electrical_classifications_pssr on public.psi_electrical_classifications(pssr_blocker);
create index if not exists idx_psi_electrical_classifications_moc on public.psi_electrical_classifications(moc_update_required);
create index if not exists idx_psi_electrical_hazard_sources_classification on public.psi_electrical_hazard_sources(classification_id, chemical_id);
create index if not exists idx_psi_area_classification_details_classification on public.psi_area_classification_details(classification_id);
create unique index if not exists uq_psi_electrical_hazard_sources_classification on public.psi_electrical_hazard_sources(classification_id);
create unique index if not exists uq_psi_area_classification_details_classification on public.psi_area_classification_details(classification_id);
create unique index if not exists uq_psi_electrical_ventilation_basis_classification on public.psi_electrical_ventilation_basis(classification_id);
create unique index if not exists uq_psi_electrical_protection_requirements_classification on public.psi_electrical_protection_requirements(classification_id);
create unique index if not exists uq_psi_electrical_ptw_controls_classification on public.psi_electrical_ptw_controls(classification_id);
create index if not exists idx_psi_electrical_installed_equipment_classification_tag on public.psi_electrical_installed_equipment(classification_id, tag_number);
create index if not exists idx_psi_electrical_conflicts_classification_status on public.psi_electrical_conflict_results(classification_id, conflict_status);
create index if not exists idx_psi_electrical_history_classification_created on public.psi_electrical_history_events(classification_id, created_at desc);

alter table public.psi_electrical_classifications enable row level security;
alter table public.psi_electrical_hazard_sources enable row level security;
alter table public.psi_area_classification_details enable row level security;
alter table public.psi_electrical_ventilation_basis enable row level security;
alter table public.psi_electrical_protection_requirements enable row level security;
alter table public.psi_electrical_installed_equipment enable row level security;
alter table public.psi_electrical_document_links enable row level security;
alter table public.psi_electrical_ptw_controls enable row level security;
alter table public.psi_electrical_completeness_evaluations enable row level security;
alter table public.psi_electrical_conflict_results enable row level security;
alter table public.psi_electrical_history_events enable row level security;
alter table public.psi_electrical_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_electrical_classifications',
    'psi_electrical_hazard_sources',
    'psi_area_classification_details',
    'psi_electrical_ventilation_basis',
    'psi_electrical_protection_requirements',
    'psi_electrical_installed_equipment',
    'psi_electrical_document_links',
    'psi_electrical_ptw_controls',
    'psi_electrical_completeness_evaluations',
    'psi_electrical_conflict_results',
    'psi_electrical_history_events',
    'psi_electrical_import_jobs'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_service_role_all'
    ) then
      execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
    end if;
  end loop;
end $$;

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select gen_random_uuid()::text, t.id, p.key, 'PSI', p.label
from public."Tenant" t
cross join (values
  ('psi.electrical_classification.view', 'View PSI Electrical Classification'),
  ('psi.electrical_classification.create', 'Create PSI Electrical Classification'),
  ('psi.electrical_classification.edit', 'Edit PSI Electrical Classification'),
  ('psi.electrical_classification.archive', 'Archive PSI Electrical Classification'),
  ('psi.electrical_classification.import', 'Import PSI Electrical Classification'),
  ('psi.electrical_classification.export', 'Export PSI Electrical Classification'),
  ('psi.electrical_classification.manage_hazard_sources', 'Manage PSI Electrical Hazard Sources'),
  ('psi.electrical_classification.manage_area_details', 'Manage PSI Area Classification Details'),
  ('psi.electrical_classification.manage_ventilation_basis', 'Manage PSI Electrical Ventilation Basis'),
  ('psi.electrical_classification.manage_protection_requirements', 'Manage PSI Electrical Protection Requirements'),
  ('psi.electrical_classification.manage_installed_equipment', 'Manage PSI Electrical Installed Equipment'),
  ('psi.electrical_classification.run_rating_check', 'Run PSI Electrical Rating Check'),
  ('psi.electrical_classification.link_document', 'Link PSI Electrical Documents'),
  ('psi.electrical_classification.remove_document', 'Remove PSI Electrical Documents'),
  ('psi.electrical_classification.manage_ptw_controls', 'Manage PSI Electrical PTW Controls'),
  ('psi.electrical_classification.run_completeness_check', 'Run PSI Electrical Completeness Check'),
  ('psi.electrical_classification.run_conflict_check', 'Run PSI Electrical Conflict Check'),
  ('psi.electrical_classification.submit_review', 'Submit PSI Electrical Review'),
  ('psi.electrical_classification.approve', 'Approve PSI Electrical Classification'),
  ('psi.electrical_classification.reject', 'Reject PSI Electrical Classification'),
  ('psi.electrical_classification.override_conflict', 'Override PSI Electrical Conflict')
) as p(key, label)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);
