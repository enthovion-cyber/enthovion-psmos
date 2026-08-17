alter table public.psi_completeness_requirements
  add column if not exists requirement_code text,
  add column if not exists requirement_title text,
  add column if not exists psi_module text,
  add column if not exists requirement_category text,
  add column if not exists requirement_description text,
  add column if not exists applicability_scope text,
  add column if not exists applicability_rule_json jsonb,
  add column if not exists required_evidence_type text,
  add column if not exists required_source_module text,
  add column if not exists required_source_field text,
  add column if not exists required_document_type text,
  add column if not exists required_approval_status text,
  add column if not exists required_review_frequency_days integer,
  add column if not exists weight numeric(8,2) not null default 1,
  add column if not exists severity_if_missing text,
  add column if not exists moc_required_if_changed boolean not null default false,
  add column if not exists waiver_allowed boolean not null default true,
  add column if not exists owner_role text,
  add column if not exists due_date_rule_json jsonb,
  add column if not exists is_default_template boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text;

update public.psi_completeness_requirements
set
  requirement_code = coalesce(requirement_code, regexp_replace(upper(coalesce(category, 'PSI') || '_' || coalesce(requirement_name, id)), '[^A-Z0-9]+', '_', 'g')),
  requirement_title = coalesce(requirement_title, requirement_name),
  psi_module = coalesce(psi_module, category),
  requirement_category = coalesce(requirement_category, category),
  applicability_scope = coalesce(applicability_scope, scope_type, 'Unit'),
  severity_if_missing = coalesce(severity_if_missing, severity, 'Medium');

create table if not exists public.psi_completeness_runs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  run_scope text not null,
  scope_record_id text,
  module_filter text,
  requirement_category_filter text,
  triggered_by_type text not null default 'Manual run',
  triggered_by_user_id text,
  triggered_by_module text,
  triggered_by_record_id text,
  status text not null default 'Queued',
  started_at timestamptz,
  completed_at timestamptz,
  total_requirements integer not null default 0,
  evaluated_requirements integer not null default 0,
  gaps_created integer not null default 0,
  gaps_resolved integer not null default 0,
  warnings_count integer not null default 0,
  errors_count integer not null default 0,
  error_message text,
  result_summary_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_completeness_scores (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  score_scope text not null,
  score_module text,
  requirement_category text,
  total_applicable_requirements integer not null default 0,
  complete_count integer not null default 0,
  partial_count integer not null default 0,
  missing_count integer not null default 0,
  waived_count integer not null default 0,
  critical_gap_count integer not null default 0,
  pssr_blocker_count integer not null default 0,
  conflict_count integer not null default 0,
  review_overdue_count integer not null default 0,
  document_gap_count integer not null default 0,
  score numeric(6,2) not null default 0,
  score_status text not null default 'No PSI / Not Started',
  blocking_reasons_json jsonb,
  last_run_id text references public.psi_completeness_runs(id) on delete set null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.psi_completeness_evaluations
  alter column unit_id drop not null,
  alter column category drop not null,
  alter column requirement_name drop not null,
  add column if not exists run_id text references public.psi_completeness_runs(id) on delete set null,
  add column if not exists area_id text,
  add column if not exists equipment_id text,
  add column if not exists psi_module text,
  add column if not exists source_module text,
  add column if not exists source_record_id text,
  add column if not exists source_record_title text,
  add column if not exists evaluation_scope text,
  add column if not exists evaluation_status text,
  add column if not exists moc_required boolean not null default false,
  add column if not exists mi_readiness_impact boolean not null default false,
  add column if not exists evidence_expected text,
  add column if not exists evidence_found text,
  add column if not exists evidence_record_json jsonb,
  add column if not exists message text,
  add column if not exists recommended_action text;

update public.psi_completeness_evaluations
set
  psi_module = coalesce(psi_module, category),
  source_module = coalesce(source_module, linked_module),
  source_record_id = coalesce(source_record_id, linked_record_id),
  evaluation_scope = coalesce(evaluation_scope, 'Unit'),
  evaluation_status = coalesce(evaluation_status, status),
  message = coalesce(message, missing_reason),
  evidence_found = coalesce(evidence_found, linked_document_id);

create table if not exists public.psi_completeness_gaps (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text,
  area_id text,
  equipment_id text,
  requirement_id text references public.psi_completeness_requirements(id) on delete set null,
  evaluation_id text references public.psi_completeness_evaluations(id) on delete set null,
  run_id text references public.psi_completeness_runs(id) on delete set null,
  gap_title text not null,
  gap_type text not null,
  gap_severity text not null,
  gap_status text not null default 'Open',
  psi_module text not null,
  source_module text,
  source_record_id text,
  source_record_title text,
  missing_item text,
  evidence_expected text,
  evidence_found text,
  reason text,
  recommended_action text,
  pssr_blocker boolean not null default false,
  moc_required boolean not null default false,
  mi_readiness_impact boolean not null default false,
  owner_user_id text,
  due_date date,
  action_id text,
  waiver_id text,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  verified_at timestamptz,
  verified_by text,
  closure_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_completeness_waivers (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  gap_id text not null references public.psi_completeness_gaps(id) on delete cascade,
  requirement_id text references public.psi_completeness_requirements(id) on delete set null,
  waiver_type text not null default 'Temporary',
  waiver_reason text not null,
  risk_justification text,
  compensating_control text,
  expiry_date date,
  review_date date,
  linked_moc_id text,
  linked_action_id text,
  evidence_document_id text,
  approval_status text not null default 'Requested',
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  revoked_by text,
  revoked_at timestamptz,
  revoke_reason text,
  e_signature_status text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_completeness_gap_actions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  gap_id text not null references public.psi_completeness_gaps(id) on delete cascade,
  action_id text not null,
  action_status text,
  action_owner_id text,
  linked_by text,
  linked_at timestamptz not null default now(),
  unlinked_by text,
  unlinked_at timestamptz
);

create table if not exists public.psi_completeness_notifications (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  gap_id text references public.psi_completeness_gaps(id) on delete cascade,
  run_id text references public.psi_completeness_runs(id) on delete set null,
  notification_type text not null,
  recipient_user_id text not null,
  status text not null default 'Queued',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_completeness_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  gap_id text references public.psi_completeness_gaps(id) on delete set null,
  requirement_id text references public.psi_completeness_requirements(id) on delete set null,
  run_id text references public.psi_completeness_runs(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'PSI Completeness Engine',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_completeness_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  scoring_method text not null default 'Weighted requirements',
  critical_gap_score_cap numeric(6,2),
  pssr_blocker_score_cap numeric(6,2),
  auto_create_actions boolean not null default false,
  auto_notify_owners boolean not null default true,
  auto_create_pssr_blockers boolean not null default true,
  allow_critical_waivers boolean not null default false,
  require_esign_for_waiver boolean not null default true,
  scheduled_run_enabled boolean not null default false,
  scheduled_run_frequency text,
  default_review_frequency_days integer,
  settings_json jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint psi_completeness_settings_scope_unique unique(company_id, site_id)
);

create index if not exists psi_completeness_requirements_module_idx on public.psi_completeness_requirements(company_id, site_id, psi_module);
create index if not exists psi_completeness_runs_status_idx on public.psi_completeness_runs(company_id, site_id, status);
create index if not exists psi_completeness_scores_unit_idx on public.psi_completeness_scores(company_id, site_id, unit_id);
create index if not exists psi_completeness_scores_scope_module_idx on public.psi_completeness_scores(score_scope, score_module);
create index if not exists psi_completeness_evaluations_run_req_idx on public.psi_completeness_evaluations(run_id, requirement_id);
create index if not exists psi_completeness_evaluations_source_idx on public.psi_completeness_evaluations(source_module, source_record_id);
create index if not exists psi_completeness_gaps_status_idx on public.psi_completeness_gaps(company_id, site_id, gap_status);
create index if not exists psi_completeness_gaps_unit_severity_idx on public.psi_completeness_gaps(unit_id, gap_severity);
create index if not exists psi_completeness_gaps_pssr_idx on public.psi_completeness_gaps(pssr_blocker);
create index if not exists psi_completeness_gaps_moc_idx on public.psi_completeness_gaps(moc_required);
create index if not exists psi_completeness_waivers_gap_status_idx on public.psi_completeness_waivers(gap_id, approval_status);
create index if not exists psi_completeness_history_gap_created_idx on public.psi_completeness_history_events(gap_id, created_at desc);

alter table public.psi_completeness_runs enable row level security;
alter table public.psi_completeness_scores enable row level security;
alter table public.psi_completeness_gaps enable row level security;
alter table public.psi_completeness_waivers enable row level security;
alter table public.psi_completeness_gap_actions enable row level security;
alter table public.psi_completeness_notifications enable row level security;
alter table public.psi_completeness_history_events enable row level security;
alter table public.psi_completeness_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_completeness_requirements',
    'psi_completeness_evaluations',
    'psi_completeness_runs',
    'psi_completeness_scores',
    'psi_completeness_gaps',
    'psi_completeness_waivers',
    'psi_completeness_gap_actions',
    'psi_completeness_notifications',
    'psi_completeness_history_events',
    'psi_completeness_settings'
  ]
  loop
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
      select *
      from (values
        ('psi.completeness.view', 'View PSI completeness'),
        ('psi.completeness.dashboard.view', 'View PSI completeness dashboard'),
        ('psi.completeness.matrix.view', 'View PSI completeness matrix'),
        ('psi.completeness.gap.view', 'View PSI completeness gaps'),
        ('psi.completeness.gap.assign', 'Assign PSI completeness gaps'),
        ('psi.completeness.gap.close', 'Close PSI completeness gaps'),
        ('psi.completeness.gap.verify', 'Verify PSI completeness gaps'),
        ('psi.completeness.gap.reopen', 'Reopen PSI completeness gaps'),
        ('psi.completeness.run', 'Run PSI completeness'),
        ('psi.completeness.run.company', 'Run company PSI completeness'),
        ('psi.completeness.run.site', 'Run site PSI completeness'),
        ('psi.completeness.run.unit', 'Run unit PSI completeness'),
        ('psi.completeness.requirement.view', 'View PSI completeness requirements'),
        ('psi.completeness.requirement.create', 'Create PSI completeness requirements'),
        ('psi.completeness.requirement.edit', 'Edit PSI completeness requirements'),
        ('psi.completeness.requirement.archive', 'Archive PSI completeness requirements'),
        ('psi.completeness.waiver.view', 'View PSI completeness waivers'),
        ('psi.completeness.waiver.request', 'Request PSI completeness waivers'),
        ('psi.completeness.waiver.approve', 'Approve PSI completeness waivers'),
        ('psi.completeness.waiver.reject', 'Reject PSI completeness waivers'),
        ('psi.completeness.waiver.revoke', 'Revoke PSI completeness waivers'),
        ('psi.completeness.action.create', 'Create actions from PSI gaps'),
        ('psi.completeness.export', 'Export PSI completeness'),
        ('psi.completeness.settings.view', 'View PSI completeness settings'),
        ('psi.completeness.settings.edit', 'Edit PSI completeness settings')
      ) as permissions(key, label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'PSI', permission_label
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = tenant_id and p."key" = permission_key
      );
    end loop;
  end loop;
end $$;
