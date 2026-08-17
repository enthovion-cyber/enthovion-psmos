create table if not exists public.psi_safeguards (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text not null,
  area_id text null,
  equipment_id text null,
  safeguard_title text not null,
  safeguard_tag text null,
  system_service text null,
  safeguard_category text not null,
  safeguard_type text not null,
  function_type text not null,
  criticality text not null default 'Medium',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  ipl_candidate boolean not null default false,
  status text not null default 'Draft',
  effectiveness_status text null,
  source_status text null,
  testing_status text null,
  impairment_status text null,
  completeness_status text not null default 'Not Reviewed',
  completeness_score integer null,
  conflict_status text not null default 'Not Checked',
  review_status text not null default 'Draft',
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  mi_readiness_impact boolean not null default false,
  owner_user_id text null,
  process_engineer_id text null,
  controls_engineer_id text null,
  mechanical_mi_owner_id text null,
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

create table if not exists public.psi_safeguard_hazard_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
  unit_id text not null,
  source_module text not null,
  source_record_id text null,
  source_record_label text null,
  scenario_title text not null,
  hazard_type text not null,
  cause_controlled text null,
  consequence_reduced text null,
  deviation_direction text null,
  severity text null,
  safeguard_role text null,
  required_performance text null,
  related_consequence text null,
  link_confidence text null,
  notes text null,
  created_by text null,
  created_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.psi_safeguard_function_requirements (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
  function_description text null,
  design_intent text null,
  required_action text null,
  required_response_time text null,
  activation_condition text null,
  safe_state text null,
  trip_action_setpoint text null,
  alarm_priority_foundation text null,
  operator_response_requirement text null,
  required_availability text null,
  required_reliability_foundation text null,
  required_proof_test_interval text null,
  required_inspection_frequency text null,
  required_maintenance_requirement text null,
  required_competence_training text null,
  failure_mode text null,
  failure_consequence text null,
  common_cause_concern text null,
  human_factor_dependency text null,
  bypass_override_allowed boolean not null default false,
  maximum_allowed_bypass_duration text null,
  temporary_impairment_controls text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_safeguard_source_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
  linked_module text not null,
  linked_record_id text null,
  linked_record_tag_title text null,
  source_status text null,
  source_readiness_status text null,
  source_test_status text null,
  source_bypass_impairment_status text null,
  source_document_status text null,
  source_last_verified_date timestamptz null,
  source_next_due_date timestamptz null,
  sync_mode text null,
  sync_notes text null,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.psi_safeguard_effectiveness_basis (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
  effectiveness_status text not null default 'Unknown / Needs Review',
  effectiveness_basis text null,
  independence_required boolean not null default false,
  independence_basis text null,
  ipl_candidate boolean not null default false,
  ipl_claimed_in_lopa boolean not null default false,
  ipl_qualification_status text null,
  demand_mode_foundation text null,
  human_response_dependency text null,
  shared_component_common_cause_note text null,
  diagnostic_monitoring_basis text null,
  failure_data_source_foundation text null,
  reliability_note text null,
  limitations_assumptions text null,
  conditions_for_credit text null,
  not_creditable_reason text null,
  engineering_review_required boolean not null default false,
  approved_exception boolean not null default false,
  exception_reason text null,
  exception_approved_by text null,
  exception_approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_safeguard_testing_status (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
  testing_required boolean not null default false,
  testing_source_module text null,
  test_proof_inspection_requirement text null,
  last_test_date timestamptz null,
  next_test_due timestamptz null,
  test_status text null,
  monitoring_method text null,
  inspection_requirement text null,
  maintenance_requirement text null,
  bypass_impairment_status text null,
  active_bypass_impairment_link text null,
  bypass_authorization_requirement text null,
  impairment_mitigation_required text null,
  temporary_control_requirement text null,
  readiness_impact boolean not null default false,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_safeguard_document_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
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

create table if not exists public.psi_safeguard_completeness_evaluations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
  unit_id text not null,
  equipment_id text null,
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

create table if not exists public.psi_safeguard_conflict_results (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
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

create table if not exists public.psi_safeguard_source_sync_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  safeguard_id text not null references public.psi_safeguards(id) on delete cascade,
  linked_module text null,
  linked_record_id text null,
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

create table if not exists public.psi_safeguard_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  safeguard_id text null references public.psi_safeguards(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'PSI Safeguards / Controls',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_safeguard_import_jobs (
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

create index if not exists idx_psi_safeguards_company_site_unit on public.psi_safeguards(company_id, site_id, unit_id);
create index if not exists idx_psi_safeguards_equipment on public.psi_safeguards(equipment_id);
create index if not exists idx_psi_safeguards_type on public.psi_safeguards(safeguard_type);
create index if not exists idx_psi_safeguards_function on public.psi_safeguards(function_type);
create index if not exists idx_psi_safeguards_criticality on public.psi_safeguards(criticality);
create index if not exists idx_psi_safeguards_pssr on public.psi_safeguards(pssr_blocker);
create index if not exists idx_psi_safeguards_mi on public.psi_safeguards(mi_readiness_impact);
create index if not exists idx_psi_safeguards_moc on public.psi_safeguards(moc_update_required);
create index if not exists idx_psi_safeguard_hazards_source on public.psi_safeguard_hazard_links(safeguard_id, source_module);
create index if not exists idx_psi_safeguard_sources_record on public.psi_safeguard_source_links(safeguard_id, linked_module, linked_record_id);
create unique index if not exists uq_psi_safeguard_function on public.psi_safeguard_function_requirements(safeguard_id);
create unique index if not exists uq_psi_safeguard_effectiveness on public.psi_safeguard_effectiveness_basis(safeguard_id);
create unique index if not exists uq_psi_safeguard_testing on public.psi_safeguard_testing_status(safeguard_id);
create index if not exists idx_psi_safeguard_conflicts_status on public.psi_safeguard_conflict_results(safeguard_id, conflict_status);
create index if not exists idx_psi_safeguard_history_created on public.psi_safeguard_history_events(safeguard_id, created_at desc);

alter table public.psi_safeguards enable row level security;
alter table public.psi_safeguard_hazard_links enable row level security;
alter table public.psi_safeguard_function_requirements enable row level security;
alter table public.psi_safeguard_source_links enable row level security;
alter table public.psi_safeguard_effectiveness_basis enable row level security;
alter table public.psi_safeguard_testing_status enable row level security;
alter table public.psi_safeguard_document_links enable row level security;
alter table public.psi_safeguard_completeness_evaluations enable row level security;
alter table public.psi_safeguard_conflict_results enable row level security;
alter table public.psi_safeguard_source_sync_events enable row level security;
alter table public.psi_safeguard_history_events enable row level security;
alter table public.psi_safeguard_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_safeguards',
    'psi_safeguard_hazard_links',
    'psi_safeguard_function_requirements',
    'psi_safeguard_source_links',
    'psi_safeguard_effectiveness_basis',
    'psi_safeguard_testing_status',
    'psi_safeguard_document_links',
    'psi_safeguard_completeness_evaluations',
    'psi_safeguard_conflict_results',
    'psi_safeguard_source_sync_events',
    'psi_safeguard_history_events',
    'psi_safeguard_import_jobs'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;

do $$
declare
  permission_key text;
  permission_label text;
  tenant_id text;
begin
  for permission_key, permission_label in
    select * from (values
      ('psi.safeguard.view', 'View PSI Safeguards / Controls'),
      ('psi.safeguard.create', 'Create PSI Safeguards / Controls'),
      ('psi.safeguard.edit', 'Edit PSI Safeguards / Controls'),
      ('psi.safeguard.archive', 'Archive PSI Safeguards / Controls'),
      ('psi.safeguard.import', 'Import PSI Safeguards / Controls'),
      ('psi.safeguard.export', 'Export PSI Safeguards / Controls'),
      ('psi.safeguard.link_hazard', 'Link PSI Safeguard Hazards'),
      ('psi.safeguard.remove_hazard', 'Remove PSI Safeguard Hazards'),
      ('psi.safeguard.manage_function_requirements', 'Manage PSI Safeguard Function Requirements'),
      ('psi.safeguard.link_source_record', 'Link PSI Safeguard Source Records'),
      ('psi.safeguard.remove_source_record', 'Remove PSI Safeguard Source Records'),
      ('psi.safeguard.manage_effectiveness', 'Manage PSI Safeguard Effectiveness'),
      ('psi.safeguard.manage_testing_status', 'Manage PSI Safeguard Testing Status'),
      ('psi.safeguard.link_document', 'Link PSI Safeguard Documents'),
      ('psi.safeguard.remove_document', 'Remove PSI Safeguard Documents'),
      ('psi.safeguard.run_source_status_check', 'Run PSI Safeguard Source Status Check'),
      ('psi.safeguard.run_completeness_check', 'Run PSI Safeguard Completeness Check'),
      ('psi.safeguard.run_conflict_check', 'Run PSI Safeguard Conflict Check'),
      ('psi.safeguard.submit_review', 'Submit PSI Safeguard Review'),
      ('psi.safeguard.approve', 'Approve PSI Safeguards'),
      ('psi.safeguard.reject', 'Reject PSI Safeguards'),
      ('psi.safeguard.override_conflict', 'Override PSI Safeguard Conflict')
    ) as permissions(key, label)
  loop
    for tenant_id in select id from public."Tenant" loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'PSI', permission_label
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = tenant_id and p."key" = permission_key
      );
    end loop;
  end loop;
end $$;
