create table if not exists public.psi_chemicals (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  area_id text,
  equipment_id text,
  chemical_name text not null,
  common_name text,
  cas_number text,
  cas_unknown_reason text,
  formula text,
  molecular_weight text,
  physical_state text not null default 'Unknown',
  chemical_category text,
  purity_concentration text,
  is_mixture boolean not null default false,
  mixture_description text,
  chemical_database_id text,
  chemical_database_snapshot_json jsonb,
  process_use text not null,
  use_type text,
  normal_inventory numeric,
  max_intended_inventory numeric not null,
  inventory_unit text not null,
  normal_temperature text,
  normal_pressure text,
  storage_temperature text,
  storage_pressure text,
  storage_condition text,
  transfer_method text,
  use_frequency text,
  operating_mode text,
  high_hazard boolean not null default false,
  psm_threshold_flag boolean not null default false,
  rmp_threshold_flag boolean not null default false,
  status text not null default 'Draft',
  review_status text not null default 'Not Reviewed',
  sds_status text not null default 'Missing',
  exposure_limit_status text not null default 'Not Reviewed',
  compatibility_risk_level text not null default 'Not Reviewed',
  emergency_response_status text not null default 'Not Reviewed',
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint psi_chemicals_unique_unit_cas_name unique (company_id, unit_id, chemical_name, cas_number)
);

create table if not exists public.psi_chemical_sds_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemical_id text not null references public.psi_chemicals(id) on delete cascade,
  sds_id text,
  document_id text,
  supplier_name text,
  manufacturer_name text,
  sds_version text,
  sds_issue_date date,
  sds_review_date date,
  sds_expiry_date date,
  language text,
  jurisdiction text,
  sds_status text not null default 'Missing',
  approved_sds boolean not null default false,
  waiver_reason text,
  waiver_requested_by text,
  waiver_requested_at timestamptz,
  waiver_approved_by text,
  waiver_approved_at timestamptz,
  waiver_rejected_by text,
  waiver_rejected_at timestamptz,
  waiver_rejection_reason text,
  source_snapshot_json jsonb,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz
);

create table if not exists public.psi_chemical_hazards (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemical_id text not null references public.psi_chemicals(id) on delete cascade,
  ghs_hazard_classes_json jsonb,
  ghs_categories_json jsonb,
  pictograms_json jsonb,
  signal_word text,
  hazard_statements_json jsonb,
  precautionary_statements_json jsonb,
  nfpa_health integer,
  nfpa_fire integer,
  nfpa_reactivity integer,
  nfpa_special text,
  hmis_health integer,
  hmis_flammability integer,
  hmis_physical_hazard integer,
  hazard_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_chemical_hazards_one_per_chemical unique (company_id, chemical_id)
);

create table if not exists public.psi_chemical_exposure_health (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemical_id text not null references public.psi_chemicals(id) on delete cascade,
  oel_value text,
  oel_unit text,
  oel_source text,
  oel_not_available_reason text,
  twa_value text,
  stel_value text,
  ceiling_value text,
  idlh_value text,
  exposure_routes_json jsonb,
  acute_toxicity_summary text,
  chronic_toxicity_summary text,
  carcinogen_flag boolean not null default false,
  mutagen_flag boolean not null default false,
  reproductive_toxicity_flag boolean not null default false,
  sensitizer_flag boolean not null default false,
  first_aid_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_chemical_exposure_one_per_chemical unique (company_id, chemical_id)
);

create table if not exists public.psi_chemical_storage_compatibility (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemical_id text not null references public.psi_chemicals(id) on delete cascade,
  storage_class text,
  compatible_storage_group text,
  incompatible_chemicals_json jsonb,
  incompatible_materials_json jsonb,
  water_reactive boolean not null default false,
  air_reactive boolean not null default false,
  oxidizer boolean not null default false,
  organic_peroxide boolean not null default false,
  acid_base_notes text,
  metal_compatibility_notes text,
  elastomer_compatibility_notes text,
  segregation_requirement text,
  ventilation_requirement text,
  compatibility_risk_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_chemical_storage_one_per_chemical unique (company_id, chemical_id)
);

create table if not exists public.psi_chemical_emergency_controls (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemical_id text not null references public.psi_chemicals(id) on delete cascade,
  required_ppe_json jsonb,
  respiratory_protection text,
  glove_requirement text,
  eye_face_protection text,
  protective_clothing text,
  spill_response_summary text,
  fire_response_summary text,
  suitable_extinguishing_media text,
  unsuitable_extinguishing_media text,
  special_firefighting_hazards text,
  emergency_response_notes text,
  waste_disposal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_chemical_emergency_one_per_chemical unique (company_id, chemical_id)
);

create table if not exists public.psi_chemical_compatibility_checks (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text references public.psi_units(id) on delete cascade,
  chemical_id text not null references public.psi_chemicals(id) on delete cascade,
  compared_chemical_id text,
  compared_material text,
  check_type text not null,
  result_status text not null,
  risk_level text not null,
  warning_message text,
  evidence_source text,
  action_required boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_chemical_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text,
  chemical_id text not null references public.psi_chemicals(id) on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'PSI Chemicals',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_chemical_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  uploaded_by text,
  file_name text not null,
  file_key text,
  status text not null default 'Preview Required',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_report_key text,
  preview_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists psi_chemicals_company_site_unit_idx on public.psi_chemicals (company_id, site_id, unit_id);
create index if not exists psi_chemicals_cas_idx on public.psi_chemicals (cas_number);
create index if not exists psi_chemicals_name_idx on public.psi_chemicals (chemical_name);
create index if not exists psi_chemicals_high_hazard_idx on public.psi_chemicals (high_hazard);
create index if not exists psi_chemicals_sds_status_idx on public.psi_chemicals (sds_status);
create index if not exists psi_chemical_sds_links_status_idx on public.psi_chemical_sds_links (chemical_id, sds_status);
create index if not exists psi_chemical_hazards_chemical_idx on public.psi_chemical_hazards (chemical_id);
create index if not exists psi_chemical_history_events_chemical_created_idx on public.psi_chemical_history_events (chemical_id, created_at desc);
create index if not exists psi_chemical_compatibility_checks_chemical_idx on public.psi_chemical_compatibility_checks (chemical_id, created_at desc);

alter table public.psi_chemicals enable row level security;
alter table public.psi_chemical_sds_links enable row level security;
alter table public.psi_chemical_hazards enable row level security;
alter table public.psi_chemical_exposure_health enable row level security;
alter table public.psi_chemical_storage_compatibility enable row level security;
alter table public.psi_chemical_emergency_controls enable row level security;
alter table public.psi_chemical_compatibility_checks enable row level security;
alter table public.psi_chemical_history_events enable row level security;
alter table public.psi_chemical_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_chemicals',
    'psi_chemical_sds_links',
    'psi_chemical_hazards',
    'psi_chemical_exposure_health',
    'psi_chemical_storage_compatibility',
    'psi_chemical_emergency_controls',
    'psi_chemical_compatibility_checks',
    'psi_chemical_history_events',
    'psi_chemical_import_jobs'
  ]
  loop
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

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select gen_random_uuid()::text, t.id, p.key, 'psi', p.label
from public."Tenant" t
cross join (values
  ('psi.chemical.view', 'View PSI chemicals and SDS'),
  ('psi.chemical.create', 'Create PSI chemicals'),
  ('psi.chemical.edit', 'Edit PSI chemicals'),
  ('psi.chemical.archive', 'Archive PSI chemicals'),
  ('psi.chemical.import', 'Import PSI chemicals'),
  ('psi.chemical.export', 'Export PSI chemicals'),
  ('psi.chemical.link_sds', 'Link chemical SDS'),
  ('psi.chemical.remove_sds', 'Remove chemical SDS'),
  ('psi.chemical.waive_sds', 'Request SDS waiver'),
  ('psi.chemical.approve_sds_waiver', 'Approve SDS waiver'),
  ('psi.chemical.run_sds_check', 'Run SDS status check'),
  ('psi.chemical.run_compatibility_check', 'Run chemical compatibility check'),
  ('psi.chemical.submit_review', 'Submit PSI chemical for review'),
  ('psi.chemical.approve', 'Approve PSI chemical'),
  ('psi.chemical.reject', 'Reject PSI chemical')
) as p(key, label)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);
