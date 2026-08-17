create table if not exists public.audit_approval_packages (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  package_number text,
  package_title text not null,
  package_description text,
  source_module text not null,
  source_object_type text not null,
  source_record_id text not null,
  source_record_number text,
  source_record_title text,
  source_record_status text,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  source_snapshot_hash text not null,
  submitted_by text,
  submitted_at timestamptz,
  package_status text not null default 'Draft',
  current_stage_id text,
  current_stage_name text,
  priority text not null default 'Normal',
  criticality text not null default 'Normal',
  safety_critical boolean not null default false,
  regulatory_critical boolean not null default false,
  psm_critical boolean not null default false,
  validation_status text not null default 'Not Run',
  validation_summary_json jsonb not null default '{}'::jsonb,
  stale_status text not null default 'Current',
  stale_reason text,
  due_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text,
  report_ready boolean not null default false,
  locked_source boolean not null default false,
  global_approval_request_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  unique(company_id, package_number)
);

create table if not exists public.audit_approval_stages (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  stage_name text not null,
  stage_order integer not null default 1,
  stage_type text not null default 'Technical Review',
  stage_status text not null default 'Pending',
  parallel boolean not null default false,
  minimum_approvals integer not null default 1,
  required boolean not null default true,
  e_signature_required boolean not null default false,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.audit_approval_packages
  drop constraint if exists audit_approval_packages_current_stage_id_fkey;
alter table public.audit_approval_packages
  add constraint audit_approval_packages_current_stage_id_fkey foreign key (current_stage_id) references public.audit_approval_stages(id);

create table if not exists public.audit_approval_participants (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  stage_id text references public.audit_approval_stages(id) on delete set null,
  reviewer_user_id text,
  reviewer_name text,
  reviewer_email text,
  reviewer_role text,
  reviewer_discipline text,
  participant_type text not null default 'Reviewer',
  participant_status text not null default 'Assigned',
  required boolean not null default true,
  delegated_from_user_id text,
  assigned_by text,
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_approval_decisions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  stage_id text references public.audit_approval_stages(id) on delete set null,
  participant_id text references public.audit_approval_participants(id) on delete set null,
  decision text not null,
  decision_status text not null default 'Final',
  reason text,
  correction_instructions text,
  conditions_json jsonb,
  e_signature_required boolean not null default false,
  e_signature_id text,
  source_snapshot_hash text,
  decided_by text,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_approval_conditions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  decision_id text references public.audit_approval_decisions(id) on delete set null,
  condition_title text not null,
  condition_description text,
  condition_owner_user_id text,
  condition_status text not null default 'Open',
  blocking boolean not null default true,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by text,
  verified_at timestamptz,
  verified_by text,
  verification_note text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_approval_validation_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  validation_type text not null,
  validation_status text not null default 'Not Run',
  check_name text,
  check_result text,
  blocking boolean not null default false,
  message text,
  details_json jsonb not null default '{}'::jsonb,
  validated_by text,
  validated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_approval_evidence_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  evidence_module text not null,
  evidence_record_id text,
  document_id text,
  evidence_title text,
  evidence_status text,
  classification text,
  restricted boolean not null default false,
  included boolean not null default true,
  excluded_reason text,
  linked_by text,
  linked_at timestamptz not null default now()
);

create table if not exists public.audit_approval_rules (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  rule_code text not null,
  rule_title text not null,
  rule_description text,
  source_module text not null,
  source_object_type text not null,
  trigger_event text not null,
  criticality text,
  safety_critical_only boolean not null default false,
  regulatory_critical_only boolean not null default false,
  psm_critical_only boolean not null default false,
  required_validation_checks_json jsonb,
  reviewer_selection_json jsonb,
  e_signature_required boolean not null default false,
  sla_days integer,
  escalation_rule_json jsonb,
  auto_lock_on_approval boolean not null default true,
  auto_mark_report_ready boolean not null default true,
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

create table if not exists public.audit_approval_rule_stages (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  rule_id text not null references public.audit_approval_rules(id) on delete cascade,
  stage_name text not null,
  stage_order integer not null default 1,
  reviewer_role text,
  reviewer_user_id text,
  required boolean not null default true,
  parallel boolean not null default false,
  minimum_approvals integer not null default 1,
  allow_reject boolean not null default true,
  allow_return boolean not null default true,
  conditions_allowed boolean not null default true,
  e_signature_required boolean not null default false,
  sla_days integer,
  escalation_owner_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_approval_esignature_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  decision_id text references public.audit_approval_decisions(id) on delete set null,
  e_signature_id text not null,
  e_signature_status text not null default 'Pending',
  signer_user_id text,
  signed_at timestamptz,
  signature_meaning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_approval_escalations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  stage_id text references public.audit_approval_stages(id) on delete set null,
  participant_id text references public.audit_approval_participants(id) on delete set null,
  escalation_reason text not null,
  escalation_status text not null default 'Open',
  escalated_to_user_id text,
  escalated_to_role text,
  escalated_by text,
  escalated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_approval_staleness_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  approval_id text not null references public.audit_approval_packages(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text,
  source_record_id text,
  previous_snapshot_hash text,
  current_snapshot_hash text,
  detected_at timestamptz not null default now(),
  detected_by text,
  resolution_status text not null default 'Open',
  resolution_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_approval_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  approval_id text references public.audit_approval_packages(id) on delete set null,
  rule_id text references public.audit_approval_rules(id) on delete set null,
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

create table if not exists public.audit_approval_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  require_esign_for_safety_critical boolean not null default true,
  require_esign_for_regulatory_critical boolean not null default true,
  prevent_self_approval boolean not null default true,
  block_approval_if_stale boolean not null default true,
  block_approval_if_validation_failed boolean not null default true,
  auto_lock_approved_records boolean not null default true,
  allow_approve_with_conditions boolean not null default true,
  default_sla_days integer not null default 7,
  settings_json jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists audit_approval_packages_company_site_status_idx on public.audit_approval_packages(company_id, site_id, package_status);
create index if not exists audit_approval_packages_source_idx on public.audit_approval_packages(source_module, source_record_id);
create index if not exists audit_approval_packages_submitter_idx on public.audit_approval_packages(submitted_by, submitted_at);
create index if not exists audit_approval_packages_due_idx on public.audit_approval_packages(due_at);
create index if not exists audit_approval_stages_order_idx on public.audit_approval_stages(approval_id, stage_order);
create index if not exists audit_approval_participants_user_idx on public.audit_approval_participants(reviewer_user_id, participant_status);
create index if not exists audit_approval_decisions_approval_idx on public.audit_approval_decisions(approval_id, decided_at);
create index if not exists audit_approval_rules_scope_idx on public.audit_approval_rules(company_id, site_id, rule_status);
create index if not exists audit_approval_rules_trigger_idx on public.audit_approval_rules(source_module, source_object_type, trigger_event);
create index if not exists audit_approval_validation_status_idx on public.audit_approval_validation_results(approval_id, validation_status);
create index if not exists audit_approval_staleness_idx on public.audit_approval_staleness_events(approval_id, detected_at);
create index if not exists audit_approval_history_idx on public.audit_approval_history_events(approval_id, created_at);
create unique index if not exists audit_approval_settings_company_site_uidx on public.audit_approval_settings(company_id, coalesce(site_id, ''));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'audit_approval_packages',
    'audit_approval_stages',
    'audit_approval_participants',
    'audit_approval_decisions',
    'audit_approval_conditions',
    'audit_approval_validation_results',
    'audit_approval_evidence_links',
    'audit_approval_rules',
    'audit_approval_rule_stages',
    'audit_approval_esignature_links',
    'audit_approval_escalations',
    'audit_approval_staleness_events',
    'audit_approval_history_events',
    'audit_approval_settings'
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
    array['audit.review.view','View audit review and approval'],
    array['audit.review.dashboard.view','View audit review dashboard'],
    array['audit.review.inbox.view','View audit review inbox'],
    array['audit.review.submission.view','View audit review submissions'],
    array['audit.review.package.view','View audit approval packages'],
    array['audit.review.package.create','Create audit approval packages'],
    array['audit.review.package.submit','Submit audit approval packages'],
    array['audit.review.package.cancel','Cancel audit approval packages'],
    array['audit.review.package.resubmit','Resubmit audit approval packages'],
    array['audit.review.package.refresh_snapshot','Refresh audit approval snapshots'],
    array['audit.review.approve','Approve audit approval packages'],
    array['audit.review.approve_with_conditions','Approve audit packages with conditions'],
    array['audit.review.reject','Reject audit approval packages'],
    array['audit.review.return','Return audit approvals for correction'],
    array['audit.review.request_info','Request audit approval information'],
    array['audit.review.delegate','Delegate audit approval'],
    array['audit.review.reassign','Reassign audit approval'],
    array['audit.review.escalate','Escalate audit approval'],
    array['audit.review.esign','E-sign audit approval'],
    array['audit.review.condition.view','View audit approval conditions'],
    array['audit.review.condition.manage','Manage audit approval conditions'],
    array['audit.review.validation.view','View audit approval validation'],
    array['audit.review.validation.run','Run audit approval validation'],
    array['audit.review.rule.view','View audit review rules'],
    array['audit.review.rule.create','Create audit review rules'],
    array['audit.review.rule.edit','Edit audit review rules'],
    array['audit.review.rule.activate','Activate audit review rules'],
    array['audit.review.rule.archive','Archive audit review rules'],
    array['audit.review.lock_source','Lock approved audit source records'],
    array['audit.review.reopen_source','Reopen approved audit source records'],
    array['audit.review.history.view','View audit approval history'],
    array['audit.review.settings.view','View audit approval settings'],
    array['audit.review.settings.edit','Edit audit approval settings']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_item slice 1 in array permissions loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_item[1], 'audit', permission_item[2]
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
    insert into public.audit_approval_settings (company_id, site_id)
    select tenant_row.id, null
    where not exists (
      select 1 from public.audit_approval_settings
      where company_id = tenant_row.id and site_id is null
    );
    for site_row in select id from public."Site" where "tenantId" = tenant_row.id loop
      insert into public.audit_approval_settings (company_id, site_id)
      select tenant_row.id, site_row.id
      where not exists (
        select 1 from public.audit_approval_settings
        where company_id = tenant_row.id and site_id = site_row.id
      );
    end loop;
  end loop;
end $$;
