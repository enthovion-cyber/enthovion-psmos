create table if not exists public.psi_approval_requests (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  psi_module text not null,
  psi_record_id text not null,
  psi_record_title text not null,
  approval_type text not null default 'Technical Review',
  approval_status text not null default 'Draft',
  current_stage_id text,
  criticality text,
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  moc_required boolean not null default false,
  pssr_blocker boolean not null default false,
  completeness_status text,
  conflict_status text,
  validation_status text not null default 'Not Run',
  submitted_by text,
  submitted_at timestamptz,
  submitter_note text,
  due_date timestamptz,
  final_decision text,
  final_decision_by text,
  final_decision_at timestamptz,
  global_workflow_id text,
  global_esignature_id text,
  stale_approval boolean not null default false,
  stale_reason text,
  locked_at timestamptz,
  locked_by text,
  closed_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_approval_stages (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  approval_request_id text not null references public.psi_approval_requests(id) on delete cascade,
  stage_order integer not null,
  stage_name text not null,
  required_role text not null,
  assigned_user_id text,
  stage_status text not null default 'Pending',
  due_date timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  completed_by text,
  decision text,
  decision_comment text,
  esign_required boolean not null default false,
  esignature_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_approval_participants (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  approval_request_id text not null references public.psi_approval_requests(id) on delete cascade,
  stage_id text references public.psi_approval_stages(id) on delete set null,
  user_id text not null,
  role_name text,
  participant_type text not null default 'Reviewer',
  can_approve boolean not null default false,
  can_comment boolean not null default true,
  can_delegate boolean not null default false,
  added_by text,
  added_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz
);

create table if not exists public.psi_approval_comments (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  approval_request_id text not null references public.psi_approval_requests(id) on delete cascade,
  stage_id text references public.psi_approval_stages(id) on delete set null,
  comment_type text not null default 'Comment',
  comment_text text not null,
  internal_only boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.psi_approval_validation_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  approval_request_id text not null references public.psi_approval_requests(id) on delete cascade,
  psi_module text not null,
  psi_record_id text not null,
  validation_key text not null,
  validation_title text not null,
  validation_status text not null default 'Not Run',
  severity text not null default 'Info',
  blocking boolean not null default false,
  message text,
  source_module text,
  source_record_id text,
  evidence_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_approval_snapshots (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  approval_request_id text not null references public.psi_approval_requests(id) on delete cascade,
  psi_module text not null,
  psi_record_id text not null,
  snapshot_type text not null default 'Submission',
  snapshot_status text not null default 'Current',
  before_json jsonb,
  after_json jsonb,
  diff_json jsonb,
  completeness_snapshot_json jsonb,
  conflict_snapshot_json jsonb,
  document_snapshot_json jsonb,
  linked_record_snapshot_json jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_approval_rules (
  id text primary key default gen_random_uuid()::text,
  company_id text references public."Tenant"(id) on delete cascade,
  site_id text,
  rule_name text not null,
  psi_module text not null,
  record_type text,
  applicability_scope text not null default 'Company',
  applicability_filter_json jsonb,
  criticality_filter text,
  safety_critical_filter boolean,
  psm_critical_filter boolean,
  moc_required_filter boolean,
  pssr_blocker_filter boolean,
  conflict_severity_filter text,
  completeness_threshold numeric(6,2),
  required_stages_json jsonb not null default '[]'::jsonb,
  required_esignature boolean not null default false,
  allow_delegate boolean not null default false,
  allow_override boolean not null default false,
  allow_waiver boolean not null default false,
  sla_hours integer,
  escalation_rule_json jsonb,
  active boolean not null default true,
  is_default_template boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text
);

create table if not exists public.psi_approval_esignature_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  approval_request_id text not null references public.psi_approval_requests(id) on delete cascade,
  stage_id text references public.psi_approval_stages(id) on delete set null,
  esignature_id text not null,
  signer_user_id text not null,
  signature_meaning text not null,
  signed_at timestamptz not null default now(),
  decision text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_approval_escalations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  approval_request_id text not null references public.psi_approval_requests(id) on delete cascade,
  stage_id text references public.psi_approval_stages(id) on delete set null,
  escalation_reason text not null,
  escalated_to_user_id text,
  escalated_to_role text,
  escalation_status text not null default 'Open',
  escalated_by text,
  escalated_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz
);

create table if not exists public.psi_approval_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  approval_request_id text,
  psi_module text,
  psi_record_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  actor_user_id text,
  reason text,
  before_value_json jsonb,
  after_value_json jsonb,
  metadata_json jsonb,
  audit_log_id text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_approval_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  block_critical_gaps boolean not null default true,
  block_critical_conflicts boolean not null default true,
  require_moc_for_impacted_changes boolean not null default true,
  require_pssr_clearance boolean not null default true,
  require_esignature_for_critical boolean not null default true,
  stale_after_source_change boolean not null default true,
  default_sla_hours integer not null default 168,
  settings_json jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, site_id)
);

create index if not exists psi_approval_requests_scope_idx on public.psi_approval_requests(company_id, site_id, unit_id, equipment_id);
create index if not exists psi_approval_requests_record_idx on public.psi_approval_requests(company_id, psi_module, psi_record_id);
create index if not exists psi_approval_requests_status_idx on public.psi_approval_requests(company_id, approval_status, validation_status, due_date);
create index if not exists psi_approval_stages_request_idx on public.psi_approval_stages(approval_request_id, stage_order);
create index if not exists psi_approval_stages_assigned_idx on public.psi_approval_stages(company_id, assigned_user_id, stage_status);
create index if not exists psi_approval_participants_request_idx on public.psi_approval_participants(approval_request_id, user_id);
create index if not exists psi_approval_comments_request_idx on public.psi_approval_comments(approval_request_id, created_at);
create index if not exists psi_approval_validation_results_request_idx on public.psi_approval_validation_results(approval_request_id, blocking);
create index if not exists psi_approval_snapshots_request_idx on public.psi_approval_snapshots(approval_request_id, created_at desc);
create index if not exists psi_approval_rules_scope_idx on public.psi_approval_rules(company_id, site_id, psi_module, active);
create index if not exists psi_approval_history_events_scope_idx on public.psi_approval_history_events(company_id, site_id, approval_request_id, created_at desc);

alter table public.psi_approval_requests enable row level security;
alter table public.psi_approval_stages enable row level security;
alter table public.psi_approval_participants enable row level security;
alter table public.psi_approval_comments enable row level security;
alter table public.psi_approval_validation_results enable row level security;
alter table public.psi_approval_snapshots enable row level security;
alter table public.psi_approval_rules enable row level security;
alter table public.psi_approval_esignature_links enable row level security;
alter table public.psi_approval_escalations enable row level security;
alter table public.psi_approval_history_events enable row level security;
alter table public.psi_approval_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_approval_requests',
    'psi_approval_stages',
    'psi_approval_participants',
    'psi_approval_comments',
    'psi_approval_validation_results',
    'psi_approval_snapshots',
    'psi_approval_rules',
    'psi_approval_esignature_links',
    'psi_approval_escalations',
    'psi_approval_history_events',
    'psi_approval_settings'
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
        ('psi.review.view', 'View PSI review approvals'),
        ('psi.review.dashboard.view', 'View PSI review dashboard'),
        ('psi.review.inbox.view', 'View PSI review inbox'),
        ('psi.review.submit', 'Submit PSI records for review'),
        ('psi.review.withdraw', 'Withdraw PSI review submissions'),
        ('psi.review.approve', 'Approve PSI reviews'),
        ('psi.review.reject', 'Reject PSI reviews'),
        ('psi.review.return', 'Return PSI reviews for changes'),
        ('psi.review.comment', 'Comment on PSI reviews'),
        ('psi.review.delegate', 'Delegate PSI reviews'),
        ('psi.review.escalate', 'Escalate PSI reviews'),
        ('psi.review.override', 'Override PSI review blockers'),
        ('psi.review.snapshot.view', 'View PSI approval snapshots'),
        ('psi.review.history.view', 'View PSI approval history'),
        ('psi.review.rule.view', 'View PSI approval rules'),
        ('psi.review.rule.create', 'Create PSI approval rules'),
        ('psi.review.rule.edit', 'Edit PSI approval rules'),
        ('psi.review.rule.archive', 'Archive PSI approval rules'),
        ('psi.review.settings.view', 'View PSI approval settings'),
        ('psi.review.settings.edit', 'Edit PSI approval settings'),
        ('psi.review.export', 'Export PSI review approvals'),
        ('psi.completeness.waiver.approve', 'Approve PSI completeness waivers')
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

do $$
declare
  tenant_id text;
  v_site_id text;
begin
  for tenant_id in select id from public."Tenant" loop
    insert into public.psi_approval_rules (company_id, site_id, rule_name, psi_module, applicability_scope, required_stages_json, required_esignature, is_default_template)
    select tenant_id, null, 'Default PSI Technical Review', 'all', 'Company',
      '[{"stageName":"Owner / Author Review","requiredRole":"Record Owner"},{"stageName":"HSE / Process Safety Review","requiredRole":"HSE / Process Safety"},{"stageName":"Final Approver / Company Admin","requiredRole":"Final Approver"}]'::jsonb,
      false,
      true
    where not exists (
      select 1 from public.psi_approval_rules
      where company_id = tenant_id and site_id is null and psi_module = 'all' and is_default_template = true
    );

    insert into public.psi_approval_settings (company_id, site_id)
    select tenant_id, null
    where not exists (
      select 1 from public.psi_approval_settings
      where company_id = tenant_id and site_id is null
    );

    for v_site_id in select id from public."Site" where "tenantId" = tenant_id loop
      insert into public.psi_approval_settings (company_id, site_id)
      select tenant_id, v_site_id
      where not exists (
        select 1 from public.psi_approval_settings
        where company_id = tenant_id and psi_approval_settings.site_id = v_site_id
      );
    end loop;
  end loop;
end $$;
