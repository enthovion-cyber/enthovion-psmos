create table if not exists public.psi_integration_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  integration_title text not null,
  integration_type text not null,
  psi_module text,
  psi_record_id text,
  psi_record_title text,
  source_module text not null,
  source_record_id text not null,
  source_record_title text,
  relationship_type text not null,
  impact_type text,
  impact_severity text not null default 'Info',
  integration_status text not null default 'Linked',
  sync_status text not null default 'Not Checked',
  blocking_status text not null default 'Not Blocking',
  required_update text,
  required_action text,
  owner_user_id text,
  due_date date,
  evidence_status text,
  last_checked_at timestamptz,
  last_synced_at timestamptz,
  notes text,
  source_snapshot_json jsonb,
  psi_snapshot_json jsonb,
  metadata_json jsonb,
  verified_by text,
  verified_at timestamptz,
  closed_by text,
  closed_at timestamptz,
  close_reason text,
  reopened_by text,
  reopened_at timestamptz,
  reopen_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_moc_impact_assessments (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  moc_id text not null,
  moc_number text,
  moc_title text,
  assessment_status text not null default 'Not Assessed',
  impact_summary text,
  psi_update_required boolean not null default false,
  completeness_run_required boolean not null default false,
  pssr_required boolean not null default false,
  hazop_revalidation_required boolean not null default false,
  mi_readiness_required boolean not null default false,
  closure_blocked boolean not null default false,
  closure_blocker_reason text,
  assessed_by text,
  assessed_at timestamptz,
  overridden_by text,
  overridden_at timestamptz,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, moc_id)
);

create table if not exists public.psi_moc_impact_items (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  moc_impact_assessment_id text not null references public.psi_moc_impact_assessments(id) on delete cascade,
  moc_id text not null,
  checklist_item text not null,
  psi_module text,
  impact_status text not null default 'Not Assessed',
  impact_required boolean not null default false,
  update_required boolean not null default false,
  blocking boolean not null default false,
  blocker_reason text,
  owner_user_id text,
  due_date date,
  action_id text,
  evidence_status text,
  verification_status text not null default 'Not Verified',
  verified_by text,
  verified_at timestamptz,
  verification_note text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_pssr_readiness_checks (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  pssr_id text not null,
  pssr_number text,
  pssr_title text,
  readiness_status text not null default 'Not Checked',
  completeness_score numeric(6,2),
  threshold_score numeric(6,2),
  blockers_count integer not null default 0,
  critical_blockers_count integer not null default 0,
  ready_with_conditions boolean not null default false,
  startup_blocked boolean not null default false,
  snapshot_json jsonb,
  checked_by text,
  checked_at timestamptz,
  override_by text,
  override_at timestamptz,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, pssr_id)
);

create table if not exists public.psi_pssr_blockers (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  pssr_readiness_check_id text not null references public.psi_pssr_readiness_checks(id) on delete cascade,
  pssr_id text not null,
  blocker_type text not null,
  blocker_title text not null,
  blocker_description text,
  psi_module text,
  psi_record_id text,
  severity text not null default 'High',
  blocker_status text not null default 'Open',
  startup_blocker boolean not null default true,
  owner_user_id text,
  due_date date,
  action_id text,
  evidence_status text,
  cleared_by text,
  cleared_at timestamptz,
  clear_reason text,
  override_by text,
  override_at timestamptz,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_hazop_basis_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  hazop_id text not null,
  hazop_node_id text,
  hazop_deviation_id text,
  psi_module text not null,
  psi_record_id text,
  psi_record_title text,
  basis_type text not null,
  basis_status text not null default 'Linked',
  source_revision text,
  source_snapshot_json jsonb,
  changed_after_study boolean not null default false,
  revalidation_required boolean not null default false,
  evidence_used boolean not null default true,
  linked_by text,
  linked_at timestamptz not null default now(),
  unlinked_by text,
  unlinked_at timestamptz,
  unlink_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_hazop_psi_actions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  hazop_id text not null,
  hazop_recommendation_id text,
  psi_module text,
  psi_record_id text,
  action_title text not null,
  action_description text,
  action_status text not null default 'Open',
  action_id text,
  owner_user_id text,
  due_date date,
  priority text,
  created_by text,
  closed_by text,
  closed_at timestamptz,
  close_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_mi_readiness_impacts (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text not null,
  mi_record_id text,
  psi_module text,
  psi_record_id text,
  impact_type text not null,
  impact_title text not null,
  impact_description text,
  impact_status text not null default 'MI Readiness Impact',
  severity text not null default 'Medium',
  sync_status text not null default 'Not Checked',
  psi_value text,
  mi_value text,
  diff_json jsonb,
  owner_user_id text,
  due_date date,
  action_id text,
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_sync_checks (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  integration_link_id text references public.psi_integration_links(id) on delete set null,
  source_module text not null,
  source_record_id text not null,
  psi_module text,
  psi_record_id text,
  check_type text not null,
  check_status text not null default 'New',
  sync_status text not null default 'Not Checked',
  diff_summary text,
  diff_json jsonb,
  impact_severity text not null default 'Info',
  action_id text,
  owner_user_id text,
  due_date date,
  checked_by text,
  checked_at timestamptz,
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  waiver_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_integration_actions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  integration_link_id text references public.psi_integration_links(id) on delete set null,
  source_module text,
  source_record_id text,
  action_id text not null,
  action_title text not null,
  action_status text not null default 'Open',
  action_owner_id text,
  due_date date,
  priority text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_integration_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  integration_link_id text,
  source_module text,
  source_record_id text,
  psi_module text,
  psi_record_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  severity text,
  actor_user_id text,
  reason text,
  before_value_json jsonb,
  after_value_json jsonb,
  metadata_json jsonb,
  audit_log_id text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_integration_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  pssr_min_completeness_score numeric(6,2) not null default 90,
  block_moc_closure_on_critical_gap boolean not null default true,
  block_pssr_startup_on_critical_gap boolean not null default true,
  require_hazop_revalidation_on_psi_change boolean not null default true,
  require_mi_sync_on_equipment_basis_change boolean not null default true,
  allow_waiver_with_approval boolean not null default true,
  auto_create_actions_for_startup_blockers boolean not null default false,
  notification_policy_json jsonb,
  settings_json jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, site_id)
);

create index if not exists psi_integration_links_company_site_idx on public.psi_integration_links(company_id, site_id);
create index if not exists psi_integration_links_source_idx on public.psi_integration_links(company_id, source_module, source_record_id);
create index if not exists psi_integration_links_psi_idx on public.psi_integration_links(company_id, psi_module, psi_record_id);
create index if not exists psi_integration_links_status_idx on public.psi_integration_links(company_id, integration_status, sync_status, blocking_status);
create index if not exists psi_moc_impact_assessments_moc_idx on public.psi_moc_impact_assessments(company_id, moc_id);
create index if not exists psi_moc_impact_items_assessment_idx on public.psi_moc_impact_items(company_id, moc_impact_assessment_id);
create index if not exists psi_pssr_readiness_checks_pssr_idx on public.psi_pssr_readiness_checks(company_id, pssr_id);
create index if not exists psi_pssr_blockers_status_idx on public.psi_pssr_blockers(company_id, pssr_id, blocker_status, severity);
create index if not exists psi_hazop_basis_links_hazop_idx on public.psi_hazop_basis_links(company_id, hazop_id);
create index if not exists psi_hazop_psi_actions_hazop_idx on public.psi_hazop_psi_actions(company_id, hazop_id, action_status);
create index if not exists psi_mi_readiness_impacts_equipment_idx on public.psi_mi_readiness_impacts(company_id, equipment_id, impact_status);
create index if not exists psi_sync_checks_status_idx on public.psi_sync_checks(company_id, check_status, sync_status);
create index if not exists psi_integration_actions_status_idx on public.psi_integration_actions(company_id, action_status, due_date);
create index if not exists psi_integration_history_events_scope_idx on public.psi_integration_history_events(company_id, site_id, created_at desc);

alter table public.psi_integration_links enable row level security;
alter table public.psi_moc_impact_assessments enable row level security;
alter table public.psi_moc_impact_items enable row level security;
alter table public.psi_pssr_readiness_checks enable row level security;
alter table public.psi_pssr_blockers enable row level security;
alter table public.psi_hazop_basis_links enable row level security;
alter table public.psi_hazop_psi_actions enable row level security;
alter table public.psi_mi_readiness_impacts enable row level security;
alter table public.psi_sync_checks enable row level security;
alter table public.psi_integration_actions enable row level security;
alter table public.psi_integration_history_events enable row level security;
alter table public.psi_integration_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_integration_links',
    'psi_moc_impact_assessments',
    'psi_moc_impact_items',
    'psi_pssr_readiness_checks',
    'psi_pssr_blockers',
    'psi_hazop_basis_links',
    'psi_hazop_psi_actions',
    'psi_mi_readiness_impacts',
    'psi_sync_checks',
    'psi_integration_actions',
    'psi_integration_history_events',
    'psi_integration_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;

do $$
declare
  tenant_id text;
  permission_key text;
  permission_label text;
begin
  for tenant_id in select id from public."Tenant" loop
    for permission_key, permission_label in
      select * from (values
        ('psi.integration.view', 'View PSI integrations'),
        ('psi.integration.dashboard.view', 'View PSI integration dashboard'),
        ('psi.integration.link.create', 'Create PSI integration links'),
        ('psi.integration.link.edit', 'Edit PSI integration links'),
        ('psi.integration.link.close', 'Close PSI integration links'),
        ('psi.integration.link.verify', 'Verify PSI integration links'),
        ('psi.integration.moc.view', 'View MOC PSI integration'),
        ('psi.integration.moc.assess', 'Assess MOC PSI impact'),
        ('psi.integration.moc.override_blocker', 'Override MOC PSI blockers'),
        ('psi.integration.pssr.view', 'View PSSR PSI readiness'),
        ('psi.integration.pssr.run_readiness', 'Run PSSR PSI readiness'),
        ('psi.integration.pssr.clear_blocker', 'Clear PSSR PSI blockers'),
        ('psi.integration.pssr.override_blocker', 'Override PSSR PSI blockers'),
        ('psi.integration.hazop.view', 'View HAZOP PSI basis'),
        ('psi.integration.hazop.link_basis', 'Link HAZOP PSI basis'),
        ('psi.integration.hazop.create_psi_action', 'Create HAZOP PSI actions'),
        ('psi.integration.mi.view', 'View MI PSI readiness'),
        ('psi.integration.mi.run_sync_check', 'Run MI PSI sync checks'),
        ('psi.integration.mi.resolve_impact', 'Resolve MI PSI impacts'),
        ('psi.integration.sync.run', 'Run PSI sync checks'),
        ('psi.integration.sync.resolve', 'Resolve PSI sync checks'),
        ('psi.integration.action.create', 'Create PSI integration actions'),
        ('psi.integration.export', 'Export PSI integration data'),
        ('psi.integration.settings.view', 'View PSI integration settings'),
        ('psi.integration.settings.edit', 'Edit PSI integration settings')
      ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'PSI', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
