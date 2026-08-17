create table if not exists public.psi_process_chemistry (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  area_id text,
  equipment_id text,
  chemistry_name text not null,
  chemistry_type text not null,
  operating_mode text not null,
  process_step text,
  status text not null default 'Draft',
  process_chemistry_summary text not null,
  main_reaction_equation text,
  balanced_reaction_available boolean not null default false,
  unavailable_reaction_reason text,
  reaction_mechanism_summary text,
  process_purpose text,
  desired_conversion text,
  desired_selectivity text,
  main_side_reactions text,
  byproducts_summary text,
  waste_streams_summary text,
  reaction_phase text,
  reversible_reaction boolean not null default false,
  catalyst_involved boolean not null default false,
  inhibitor_required boolean not null default false,
  solvent_involved boolean not null default false,
  water_moisture_sensitivity boolean not null default false,
  air_oxygen_sensitivity boolean not null default false,
  addition_order_sensitivity boolean not null default false,
  mixing_sensitivity boolean not null default false,
  cooling_sensitivity boolean not null default false,
  hazard_level text not null default 'Unknown / Needs Study',
  runaway_potential text not null default 'Unknown / Needs Study',
  decomposition_potential text not null default 'Unknown / Needs Study',
  polymerization_potential text not null default 'Unknown / Needs Study',
  pssr_blocker boolean not null default false,
  moc_update_required boolean not null default false,
  completeness_status text not null default 'Not Reviewed',
  completeness_score numeric(5,2),
  owner_user_id text,
  process_engineer_id text,
  hse_reviewer_id text,
  last_review_date date,
  next_review_due date,
  review_status text not null default 'Not Reviewed',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text
);

create table if not exists public.psi_process_chemistry_chemical_roles (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  unit_id text not null references public.psi_units(id) on delete cascade,
  chemical_id text not null references public.psi_chemicals(id) on delete restrict,
  chemical_role text not null,
  normal_concentration text,
  min_concentration text,
  max_concentration text,
  concentration_unit text,
  normal_feed_rate text,
  feed_rate_unit text,
  normal_ratio text,
  addition_order text,
  addition_rate_limit text,
  criticality text,
  hazard_contribution text,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_process_chemistry_conditions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  normal_temperature text,
  min_temperature text,
  max_temperature text,
  temperature_unit text,
  design_temperature_reference text,
  normal_pressure text,
  min_pressure text,
  max_pressure text,
  pressure_unit text,
  design_pressure_reference text,
  ph_normal text,
  ph_min text,
  ph_max text,
  normal_concentration_range text,
  feed_ratio_range text,
  residence_time text,
  reaction_time text,
  agitation_speed text,
  cooling_duty text,
  heating_duty text,
  utility_requirements text,
  inerting_requirement text,
  oxygen_limit text,
  moisture_limit text,
  addition_rate_limit text,
  venting_requirement text,
  heat_release_absorption text,
  gas_generation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_process_chemistry_conditions_one unique (company_id, chemistry_id)
);

create table if not exists public.psi_process_chemistry_hazards (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  exothermic boolean not null default false,
  endothermic boolean not null default false,
  heat_of_reaction_available boolean not null default false,
  heat_of_reaction_value text,
  heat_of_reaction_unit text,
  adiabatic_temperature_rise_available boolean not null default false,
  adiabatic_temperature_rise text,
  runaway_potential text not null default 'Unknown / Needs Study',
  decomposition_potential text not null default 'Unknown / Needs Study',
  polymerization_potential text not null default 'Unknown / Needs Study',
  overpressure_potential text not null default 'Unknown / Needs Study',
  gas_generation_potential text,
  toxic_gas_generation_potential text,
  flammable_vapor_generation_potential text,
  corrosion_potential text,
  erosion_solids_potential text,
  fouling_plugging_potential text,
  crystallization_solidification_risk text,
  incompatible_mixing_risk text,
  thermal_instability_risk text,
  shock_friction_sensitivity text,
  static_ignition_concern text,
  dust_explosion_concern text,
  environmental_release_concern text,
  reaction_hazard_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_process_chemistry_hazards_one unique (company_id, chemistry_id)
);

create table if not exists public.psi_unwanted_reaction_scenarios (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  unit_id text not null references public.psi_units(id) on delete cascade,
  scenario_title text not null,
  scenario_type text not null,
  trigger_cause text,
  deviation_condition text,
  involved_chemicals_json jsonb,
  expected_behavior text,
  consequence text,
  severity text not null default 'Unknown / Needs Study',
  likelihood text,
  existing_safeguards_summary text,
  required_operator_response text,
  emergency_response text,
  related_hazop_deviation_id text,
  related_lopa_sil_id text,
  related_safe_operating_limit_id text,
  related_alarm_interlock_sif_id text,
  additional_actions_required boolean not null default false,
  uncontrolled_high_severity boolean not null default false,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_process_chemistry_controls (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  unit_id text not null references public.psi_units(id) on delete cascade,
  control_type text not null,
  linked_module text,
  linked_record_id text,
  control_description text not null,
  hazard_scenario_id text,
  required_response text,
  reliability_criticality text,
  test_inspection_requirement text,
  owner_user_id text,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_process_chemistry_document_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  document_id text not null,
  document_type text not null,
  relationship_type text not null default 'Reference',
  required boolean not null default false,
  readiness_impact boolean not null default false,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.psi_process_chemistry_completeness_evaluations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  unit_id text not null references public.psi_units(id) on delete cascade,
  check_key text not null,
  check_title text not null,
  status text not null,
  severity text not null default 'Medium',
  message text,
  missing_reason text,
  pssr_blocker boolean not null default false,
  action_required boolean not null default false,
  owner_user_id text,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_process_chemistry_eval_unique unique (company_id, chemistry_id, check_key)
);

create table if not exists public.psi_process_chemistry_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text,
  chemistry_id text not null references public.psi_process_chemistry(id) on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'PSI Process Chemistry',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_process_chemistry_import_jobs (
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

create index if not exists psi_process_chemistry_company_site_unit_idx on public.psi_process_chemistry(company_id, site_id, unit_id);
create index if not exists psi_process_chemistry_type_idx on public.psi_process_chemistry(chemistry_type);
create index if not exists psi_process_chemistry_hazard_idx on public.psi_process_chemistry(hazard_level);
create index if not exists psi_process_chemistry_runaway_idx on public.psi_process_chemistry(runaway_potential);
create index if not exists psi_process_chemistry_pssr_idx on public.psi_process_chemistry(pssr_blocker);
create index if not exists psi_process_chemistry_roles_idx on public.psi_process_chemistry_chemical_roles(chemistry_id, chemical_id);
create index if not exists psi_unwanted_scenarios_severity_idx on public.psi_unwanted_reaction_scenarios(chemistry_id, severity);
create index if not exists psi_process_chemistry_history_idx on public.psi_process_chemistry_history_events(chemistry_id, created_at desc);

alter table public.psi_process_chemistry enable row level security;
alter table public.psi_process_chemistry_chemical_roles enable row level security;
alter table public.psi_process_chemistry_conditions enable row level security;
alter table public.psi_process_chemistry_hazards enable row level security;
alter table public.psi_unwanted_reaction_scenarios enable row level security;
alter table public.psi_process_chemistry_controls enable row level security;
alter table public.psi_process_chemistry_document_links enable row level security;
alter table public.psi_process_chemistry_completeness_evaluations enable row level security;
alter table public.psi_process_chemistry_history_events enable row level security;
alter table public.psi_process_chemistry_import_jobs enable row level security;

grant select, insert, update, delete on table public.psi_process_chemistry to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_chemical_roles to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_conditions to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_hazards to service_role;
grant select, insert, update, delete on table public.psi_unwanted_reaction_scenarios to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_controls to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_document_links to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_completeness_evaluations to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_history_events to service_role;
grant select, insert, update, delete on table public.psi_process_chemistry_import_jobs to service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_process_chemistry',
    'psi_process_chemistry_chemical_roles',
    'psi_process_chemistry_conditions',
    'psi_process_chemistry_hazards',
    'psi_unwanted_reaction_scenarios',
    'psi_process_chemistry_controls',
    'psi_process_chemistry_document_links',
    'psi_process_chemistry_completeness_evaluations',
    'psi_process_chemistry_history_events',
    'psi_process_chemistry_import_jobs'
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
  ('psi.process_chemistry.view', 'View PSI process chemistry'),
  ('psi.process_chemistry.create', 'Create PSI process chemistry'),
  ('psi.process_chemistry.edit', 'Edit PSI process chemistry'),
  ('psi.process_chemistry.archive', 'Archive PSI process chemistry'),
  ('psi.process_chemistry.import', 'Import PSI process chemistry'),
  ('psi.process_chemistry.export', 'Export PSI process chemistry'),
  ('psi.process_chemistry.link_chemical', 'Link PSI process chemistry chemicals'),
  ('psi.process_chemistry.remove_chemical', 'Remove PSI process chemistry chemicals'),
  ('psi.process_chemistry.manage_conditions', 'Manage PSI process chemistry conditions'),
  ('psi.process_chemistry.manage_hazards', 'Manage PSI process chemistry hazards'),
  ('psi.process_chemistry.manage_scenarios', 'Manage PSI unwanted reaction scenarios'),
  ('psi.process_chemistry.manage_controls', 'Manage PSI process chemistry controls'),
  ('psi.process_chemistry.run_completeness_check', 'Run PSI process chemistry completeness check'),
  ('psi.process_chemistry.submit_review', 'Submit PSI process chemistry review'),
  ('psi.process_chemistry.approve', 'Approve PSI process chemistry'),
  ('psi.process_chemistry.reject', 'Reject PSI process chemistry')
) as p(key, label)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);
