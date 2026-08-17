create table if not exists public.training_approval_requests (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  approval_code text,
  approval_title text not null,
  source_module text not null,
  source_record_type text not null,
  source_record_id text not null,
  source_record_title text,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  current_snapshot_hash text,
  submitted_by text,
  submitted_at timestamptz not null default now(),
  current_stage_id text,
  approval_status text not null default 'Submitted',
  priority text not null default 'Normal',
  safety_critical boolean not null default false,
  confidentiality_level text,
  validation_status text not null default 'Not Run',
  stale_status text not null default 'Current',
  stale_reason text,
  due_date timestamptz,
  completed_at timestamptz,
  cancelled_by text,
  cancelled_at timestamptz,
  cancel_reason text,
  global_workflow_id text,
  sla_status text not null default 'On Track',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, approval_code)
);

create table if not exists public.training_approval_stages (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  stage_name text not null,
  stage_order integer not null default 1,
  stage_type text not null default 'Single Reviewer',
  reviewer_role text,
  reviewer_user_id text,
  required_permission text,
  sla_hours integer,
  due_at timestamptz,
  stage_status text not null default 'Pending',
  quorum_required integer,
  escalation_role text,
  escalation_user_id text,
  esign_required boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_approval_requests
  drop constraint if exists training_approval_requests_current_stage_id_fkey;
alter table public.training_approval_requests
  add constraint training_approval_requests_current_stage_id_fkey foreign key (current_stage_id) references public.training_approval_stages(id);

create table if not exists public.training_approval_participants (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  stage_id text references public.training_approval_stages(id) on delete set null,
  user_id text,
  role_name text,
  participant_type text not null,
  participant_status text not null default 'Assigned',
  delegated_from_user_id text,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_approval_decisions (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  stage_id text references public.training_approval_stages(id) on delete set null,
  decision text not null,
  decision_reason text,
  conditions_json jsonb,
  decided_by text,
  decided_at timestamptz not null default now(),
  esignature_id text,
  esignature_status text,
  source_snapshot_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_approval_comments (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  stage_id text references public.training_approval_stages(id) on delete set null,
  comment_text text not null,
  comment_type text not null default 'General',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by text
);

create table if not exists public.training_approval_validation_results (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  validation_status text not null,
  validation_type text not null default 'Manual',
  checks_json jsonb not null default '[]'::jsonb,
  warnings_json jsonb,
  errors_json jsonb,
  stale_reasons_json jsonb,
  validated_by text,
  validated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.training_approval_evidence_links (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  evidence_module text not null,
  evidence_record_id text,
  document_id text,
  evidence_title text,
  evidence_status text,
  included boolean not null default true,
  excluded_reason text,
  linked_at timestamptz not null default now()
);

create table if not exists public.training_approval_rules (
  id text primary key,
  company_id text not null,
  site_id text,
  rule_code text not null,
  rule_title text not null,
  source_module text not null,
  source_record_type text not null,
  trigger_event text not null,
  scope_json jsonb,
  safety_critical_only boolean not null default false,
  criticality_threshold text,
  stages_json jsonb not null default '[]'::jsonb,
  validation_requirements_json jsonb,
  esign_required boolean not null default false,
  lock_source_after_approval boolean not null default true,
  rule_status text not null default 'Draft',
  owner_user_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  unique(company_id, site_id, rule_code)
);

create table if not exists public.training_approval_esignature_links (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  decision_id text references public.training_approval_decisions(id) on delete set null,
  esignature_id text not null,
  esignature_status text not null default 'Pending',
  signer_user_id text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.training_approval_escalations (
  id text primary key,
  company_id text not null,
  site_id text,
  approval_request_id text not null references public.training_approval_requests(id) on delete cascade,
  stage_id text references public.training_approval_stages(id) on delete set null,
  escalation_reason text not null,
  escalated_to_user_id text,
  escalated_to_role text,
  escalated_by text,
  escalated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_approval_history_events (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  approval_request_id text references public.training_approval_requests(id) on delete set null,
  source_module text,
  source_record_type text,
  source_record_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_approval_settings (
  id text primary key,
  company_id text not null,
  site_id text,
  require_approval_for_safety_critical_profiles boolean not null default true,
  require_approval_for_required_training boolean not null default true,
  require_approval_for_safety_critical_training_records boolean not null default true,
  require_approval_for_safety_critical_certificates boolean not null default true,
  require_approval_for_assessment_overrides boolean not null default true,
  require_approval_for_sop_ack_waivers boolean not null default true,
  require_approval_for_moc_training_waivers boolean not null default true,
  require_approval_for_pssr_training_waivers boolean not null default true,
  require_approval_for_ptw_authorizations boolean not null default true,
  require_approval_for_ptw_emergency_override boolean not null default true,
  require_approval_for_restricted_reports boolean not null default false,
  require_esign_for_safety_critical_approval boolean not null default true,
  auto_escalate_overdue_approvals boolean not null default true,
  default_approval_sla_hours integer not null default 72,
  auto_lock_source_after_approval boolean not null default true,
  stale_approval_blocks_decision boolean not null default true,
  settings_json jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists training_approval_requests_company_site_status_idx on public.training_approval_requests(company_id, site_id, approval_status);
create index if not exists training_approval_requests_source_idx on public.training_approval_requests(source_module, source_record_type, source_record_id);
create index if not exists training_approval_requests_submitter_idx on public.training_approval_requests(submitted_by, submitted_at);
create index if not exists training_approval_stages_status_idx on public.training_approval_stages(approval_request_id, stage_status);
create index if not exists training_approval_participants_user_idx on public.training_approval_participants(user_id, participant_status);
create index if not exists training_approval_decisions_request_idx on public.training_approval_decisions(approval_request_id, decided_at);
create index if not exists training_approval_rules_scope_idx on public.training_approval_rules(company_id, site_id, source_module);
create index if not exists training_approval_history_request_idx on public.training_approval_history_events(approval_request_id, created_at);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_approval_requests',
    'training_approval_stages',
    'training_approval_participants',
    'training_approval_decisions',
    'training_approval_comments',
    'training_approval_validation_results',
    'training_approval_evidence_links',
    'training_approval_rules',
    'training_approval_esignature_links',
    'training_approval_escalations',
    'training_approval_history_events',
    'training_approval_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_tenant_policy'
    ) then
      execute format(
        'create policy %I on public.%I for all using (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''') with check (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''')',
        table_name || '_tenant_policy',
        table_name
      );
    end if;
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

do $$
declare
  permission_item text[];
  tenant_row record;
  permissions text[][] := array[
    array['training.review.view','View training review approvals'],
    array['training.review.dashboard.view','View training review dashboard'],
    array['training.review.inbox.view','View training review inbox'],
    array['training.review.submission.view','View training review submissions'],
    array['training.review.request.view','View training approval packages'],
    array['training.review.request.create','Create training approval packages'],
    array['training.review.request.cancel','Cancel training approval packages'],
    array['training.review.request.resubmit','Resubmit training approval packages'],
    array['training.review.approve','Approve training approval packages'],
    array['training.review.approve.safety_critical','Approve safety-critical training packages'],
    array['training.review.reject','Reject training approval packages'],
    array['training.review.return','Return training approvals for correction'],
    array['training.review.escalate','Escalate training approvals'],
    array['training.review.reassign','Reassign training approvals'],
    array['training.review.comment','Comment on training approvals'],
    array['training.review.validate','Validate training approval packages'],
    array['training.review.esign','E-sign training approvals'],
    array['training.review.rule.view','View training approval rules'],
    array['training.review.rule.create','Create training approval rules'],
    array['training.review.rule.edit','Edit training approval rules'],
    array['training.review.rule.archive','Archive training approval rules'],
    array['training.review.history.view','View training approval history'],
    array['training.review.settings.view','View training approval settings'],
    array['training.review.settings.edit','Edit training approval settings']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_item slice 1 in array permissions loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_item[1], 'training', permission_item[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_item[1]
      );
    end loop;
  end loop;
end $$;

do $$
declare
  tenant_row record;
  site_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    insert into public.training_approval_settings (id, company_id, site_id, updated_at)
    select gen_random_uuid()::text, tenant_row.id, null, now()
    where not exists (
      select 1 from public.training_approval_settings
      where company_id = tenant_row.id and site_id is null
    );
    for site_row in select id from public."Site" where "tenantId" = tenant_row.id loop
      insert into public.training_approval_settings (id, company_id, site_id, updated_at)
      select gen_random_uuid()::text, tenant_row.id, site_row.id, now()
      where not exists (
        select 1 from public.training_approval_settings
        where company_id = tenant_row.id and site_id = site_row.id
      );
    end loop;
  end loop;
end $$;
