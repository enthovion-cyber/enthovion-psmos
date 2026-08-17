-- Training & Competency Phase 8 - SOP Acknowledgements.
-- This migration creates a real SOP acknowledgement source-of-truth without
-- duplicating SOP Library, Document Control, Training Matrix, Records, or Assessments.

create table if not exists public.training_sop_ack_requirements (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  requirement_code text not null,
  requirement_title text not null,
  description text null,
  requirement_source text not null,
  owner_user_id text null,
  reviewer_user_id text null,
  requirement_status text not null default 'Draft',
  review_status text null default 'Draft',
  effective_date date null,
  next_review_due date null,
  sop_id text null,
  document_id text null,
  sop_title text null,
  document_number text null,
  required_version text null,
  revision_number text null,
  current_version_at_requirement text null,
  current_version_policy text not null default 'Current approved version only',
  document_status text null,
  document_owner text null,
  document_url text null,
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  ptw_critical boolean not null default false,
  moc_critical boolean not null default false,
  pssr_critical boolean not null default false,
  blocks_ptw_authorization boolean not null default false,
  blocks_moc_implementation boolean not null default false,
  blocks_pssr_startup boolean not null default false,
  blocks_safety_critical_work boolean not null default false,
  creates_action_if_missing boolean not null default false,
  sends_notification_if_missing boolean not null default true,
  escalates_if_overdue boolean not null default false,
  gap_severity text null,
  waiver_allowed boolean not null default true,
  waiver_approval_role text null,
  temporary_waiver_max_duration_days integer null,
  sync_to_matrix boolean not null default true,
  sync_to_competency boolean not null default true,
  sync_status text null default 'Not Synced',
  required_training_item_id text null references public.training_required_items(id) on delete set null,
  matrix_rule_id text null,
  competency_profile_id text null,
  competency_requirement_id text null,
  training_record_id text null,
  assessment_id text null,
  notes text null,
  created_by text not null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  constraint training_sop_ack_requirement_code_unique unique (company_id, site_id, requirement_code),
  constraint training_sop_ack_blocker_has_critical_basis check (
    not (blocks_ptw_authorization or blocks_moc_implementation or blocks_pssr_startup or blocks_safety_critical_work)
    or safety_critical or psm_critical
  ),
  constraint training_sop_ack_recurring_waiver_non_negative check (temporary_waiver_max_duration_days is null or temporary_waiver_max_duration_days >= 0)
);

create table if not exists public.training_sop_ack_requirement_scopes (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  requirement_id text not null references public.training_sop_ack_requirements(id) on delete cascade,
  scope_type text not null,
  site_scope_id text null,
  department_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  worker_type_filter text null,
  employer_type_filter text null,
  contractor_company_filter text null,
  job_role_filter text null,
  competency_profile_id text null,
  ptw_role_filter text null,
  required_training_item_id text null references public.training_required_items(id) on delete set null,
  matrix_rule_id text null,
  specific_worker_id text null references public.training_workers(id) on delete cascade,
  applicability_rule_json jsonb null,
  auto_generate_assignments boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sop_ack_due_rules (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  requirement_id text not null references public.training_sop_ack_requirements(id) on delete cascade,
  initial_due_rule_json jsonb null,
  due_days_after_assignment integer null,
  due_days_after_sop_effective_date integer null,
  due_before_site_access boolean not null default false,
  due_before_unit_assignment boolean not null default false,
  due_before_ptw_authorization boolean not null default false,
  due_before_moc_implementation boolean not null default false,
  due_before_pssr_startup boolean not null default false,
  due_before_safety_critical_task boolean not null default false,
  grace_period_days integer null,
  reminder_days_before_due integer null,
  recurring boolean not null default false,
  recurrence_interval_days integer null,
  reacknowledge_on_sop_revision boolean not null default true,
  reacknowledge_on_major_revision_only boolean not null default true,
  reacknowledge_after_moc boolean not null default false,
  reacknowledge_after_incident boolean not null default false,
  reacknowledge_after_psi_change boolean not null default false,
  expiry_rule_json jsonb null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_sop_ack_due_non_negative check (
    (due_days_after_assignment is null or due_days_after_assignment >= 0)
    and (due_days_after_sop_effective_date is null or due_days_after_sop_effective_date >= 0)
    and (grace_period_days is null or grace_period_days >= 0)
    and (reminder_days_before_due is null or reminder_days_before_due >= 0)
    and (recurrence_interval_days is null or recurrence_interval_days >= 0)
  ),
  constraint training_sop_ack_recurring_interval_required check (not recurring or recurrence_interval_days is not null)
);

create table if not exists public.training_sop_ack_evidence_rules (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  requirement_id text not null references public.training_sop_ack_requirements(id) on delete cascade,
  simple_acknowledgement_required boolean not null default true,
  esign_required boolean not null default false,
  declaration_text text null,
  assessment_required boolean not null default false,
  assessment_id text null,
  minimum_passing_score numeric null,
  supervisor_verification_required boolean not null default false,
  hse_verification_required boolean not null default false,
  document_evidence_required boolean not null default false,
  evidence_document_id text null,
  attestation_statement text null,
  rejection_allowed boolean not null default true,
  verification_role text null,
  approval_required boolean not null default false,
  acknowledgement_method text not null default 'Click acknowledge',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sop_ack_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  requirement_id text not null references public.training_sop_ack_requirements(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_title text null,
  relationship_type text not null,
  relationship_reason text null,
  required boolean not null default false,
  safety_critical boolean not null default false,
  linked_by text not null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.training_sop_ack_assignments (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  requirement_id text not null references public.training_sop_ack_requirements(id) on delete cascade,
  sop_id text null,
  document_id text null,
  required_version text null,
  current_version_at_assignment text null,
  assignment_source text not null default 'Manual assignment',
  required_because text null,
  due_date date null,
  expiry_date date null,
  assignment_status text not null default 'Assigned',
  acknowledgement_status text not null default 'Pending',
  verification_status text null default 'Not Required',
  esignature_status text null default 'Not Required',
  assessment_status text null default 'Not Required',
  overdue boolean not null default false,
  current_version_gap boolean not null default false,
  ptw_blocker boolean not null default false,
  moc_blocker boolean not null default false,
  pssr_blocker boolean not null default false,
  safety_critical_work_blocker boolean not null default false,
  action_id text null,
  waiver_id text null,
  last_notification_sent_at timestamptz null,
  assigned_by text null,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz null,
  cancelled_by text null,
  cancelled_at timestamptz null,
  cancel_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_sop_ack_assignment_unique unique (company_id, worker_id, requirement_id)
);

create table if not exists public.training_sop_acknowledgements (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  assignment_id text not null references public.training_sop_ack_assignments(id) on delete cascade,
  requirement_id text not null references public.training_sop_ack_requirements(id) on delete cascade,
  sop_id text null,
  document_id text null,
  acknowledged_version text not null,
  current_version_at_acknowledgement text null,
  declaration_text text null,
  acknowledgement_method text not null,
  acknowledgement_status text not null default 'Acknowledged',
  acknowledged_by_user_id text null,
  acknowledged_at timestamptz null,
  ip_address text null,
  user_agent text null,
  esignature_id text null,
  esignature_status text null default 'Not Required',
  assessment_id text null,
  assessment_result_id text null,
  assessment_status text null default 'Not Required',
  evidence_document_id text null,
  verification_status text null default 'Not Required',
  verified_by text null,
  verified_at timestamptz null,
  rejected_by text null,
  rejected_at timestamptz null,
  rejection_reason text null,
  returned_by text null,
  returned_at timestamptz null,
  return_reason text null,
  reopened_by text null,
  reopened_at timestamptz null,
  reopen_reason text null,
  override_reason text null,
  source_snapshot_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sop_ack_revision_impacts (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  requirement_id text null references public.training_sop_ack_requirements(id) on delete set null,
  sop_id text null,
  document_id text null,
  old_version text null,
  new_version text null,
  revision_type text not null,
  revision_reason text null,
  significant_change boolean not null default false,
  reacknowledgement_required boolean not null default false,
  impacted_assignment_count integer not null default 0,
  impacted_worker_count integer not null default 0,
  matrix_impacted boolean not null default false,
  competency_impacted boolean not null default false,
  ptw_impacted boolean not null default false,
  moc_impacted boolean not null default false,
  pssr_impacted boolean not null default false,
  triggered_by_module text null,
  triggered_by_record_id text null,
  detected_at timestamptz not null default now(),
  processed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_sop_ack_waivers (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  assignment_id text not null references public.training_sop_ack_assignments(id) on delete cascade,
  requirement_id text not null references public.training_sop_ack_requirements(id) on delete cascade,
  waiver_type text not null default 'Temporary',
  waiver_reason text not null,
  risk_justification text null,
  compensating_control text null,
  expiry_date date null,
  linked_moc_id text null,
  linked_pssr_id text null,
  linked_ptw_id text null,
  evidence_document_id text null,
  approval_status text not null default 'Requested',
  approved_by text null,
  approved_at timestamptz null,
  rejected_by text null,
  rejected_at timestamptz null,
  rejection_reason text null,
  revoked_by text null,
  revoked_at timestamptz null,
  revoke_reason text null,
  e_signature_status text null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_sop_ack_temp_waiver_expiry check (waiver_type <> 'Temporary' or expiry_date is not null)
);

create table if not exists public.training_sop_ack_evaluation_runs (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  run_scope text not null,
  scope_record_id text null,
  triggered_by_type text not null,
  triggered_by_user_id text null,
  triggered_by_module text null,
  triggered_by_record_id text null,
  status text not null default 'Queued',
  started_at timestamptz null,
  completed_at timestamptz null,
  total_workers integer not null default 0,
  evaluated_workers integer not null default 0,
  assignments_created integer not null default 0,
  reacknowledgements_created integer not null default 0,
  gaps_created integer not null default 0,
  gaps_resolved integer not null default 0,
  warnings_count integer not null default 0,
  errors_count integer not null default 0,
  error_message text null,
  result_summary_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sop_ack_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text null references public.training_workers(id) on delete set null,
  requirement_id text null references public.training_sop_ack_requirements(id) on delete set null,
  assignment_id text null references public.training_sop_ack_assignments(id) on delete set null,
  acknowledgement_id text null references public.training_sop_acknowledgements(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'Training SOP Acknowledgements',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_sop_ack_settings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  default_due_days_after_assignment integer not null default 14,
  default_reminder_days_before_due integer not null default 7,
  default_reacknowledge_on_major_revision boolean not null default true,
  require_esign_for_safety_critical_sop boolean not null default true,
  require_verification_for_safety_critical_sop boolean not null default false,
  require_assessment_for_critical_sop boolean not null default false,
  auto_generate_assignments_on_requirement_activation boolean not null default true,
  auto_reacknowledge_on_sop_revision boolean not null default true,
  auto_update_matrix_on_acknowledgement boolean not null default true,
  auto_update_competency_on_acknowledgement boolean not null default true,
  auto_notify_workers boolean not null default true,
  auto_notify_supervisors_on_overdue boolean not null default true,
  auto_create_actions_for_overdue_critical boolean not null default false,
  block_ptw_on_missing_sop_ack boolean not null default true,
  block_moc_on_missing_sop_ack boolean not null default true,
  block_pssr_on_missing_sop_ack boolean not null default true,
  allow_safety_critical_waivers boolean not null default false,
  require_esign_for_blocker_waiver boolean not null default true,
  settings_json jsonb null,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  constraint training_sop_ack_settings_unique unique (company_id, site_id),
  constraint training_sop_ack_settings_non_negative check (
    default_due_days_after_assignment >= 0 and default_reminder_days_before_due >= 0
  )
);

create index if not exists training_sop_ack_requirements_scope_idx on public.training_sop_ack_requirements(company_id, site_id, requirement_status);
create index if not exists training_sop_ack_requirements_doc_idx on public.training_sop_ack_requirements(document_id, sop_id);
create index if not exists training_sop_ack_scopes_requirement_idx on public.training_sop_ack_requirement_scopes(requirement_id, scope_type);
create index if not exists training_sop_ack_assignments_worker_idx on public.training_sop_ack_assignments(company_id, site_id, worker_id);
create index if not exists training_sop_ack_assignments_status_idx on public.training_sop_ack_assignments(requirement_id, acknowledgement_status);
create index if not exists training_sop_ack_assignments_overdue_idx on public.training_sop_ack_assignments(overdue);
create index if not exists training_sop_ack_assignments_version_gap_idx on public.training_sop_ack_assignments(current_version_gap);
create index if not exists training_sop_ack_assignments_ptw_idx on public.training_sop_ack_assignments(ptw_blocker);
create index if not exists training_sop_ack_assignments_moc_idx on public.training_sop_ack_assignments(moc_blocker);
create index if not exists training_sop_ack_assignments_pssr_idx on public.training_sop_ack_assignments(pssr_blocker);
create index if not exists training_sop_acknowledgements_worker_requirement_idx on public.training_sop_acknowledgements(worker_id, requirement_id);
create index if not exists training_sop_acknowledgements_doc_version_idx on public.training_sop_acknowledgements(document_id, acknowledged_version);
create index if not exists training_sop_ack_revision_impacts_requirement_idx on public.training_sop_ack_revision_impacts(requirement_id, detected_at);
create index if not exists training_sop_ack_history_worker_idx on public.training_sop_ack_history_events(worker_id, created_at);

alter table public.training_sop_ack_requirements enable row level security;
alter table public.training_sop_ack_requirement_scopes enable row level security;
alter table public.training_sop_ack_due_rules enable row level security;
alter table public.training_sop_ack_evidence_rules enable row level security;
alter table public.training_sop_ack_links enable row level security;
alter table public.training_sop_ack_assignments enable row level security;
alter table public.training_sop_acknowledgements enable row level security;
alter table public.training_sop_ack_revision_impacts enable row level security;
alter table public.training_sop_ack_waivers enable row level security;
alter table public.training_sop_ack_evaluation_runs enable row level security;
alter table public.training_sop_ack_history_events enable row level security;
alter table public.training_sop_ack_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_sop_ack_requirements',
    'training_sop_ack_requirement_scopes',
    'training_sop_ack_due_rules',
    'training_sop_ack_evidence_rules',
    'training_sop_ack_links',
    'training_sop_ack_assignments',
    'training_sop_acknowledgements',
    'training_sop_ack_revision_impacts',
    'training_sop_ack_waivers',
    'training_sop_ack_evaluation_runs',
    'training_sop_ack_history_events',
    'training_sop_ack_settings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_isolation', table_name);
    execute format(
      'create policy %I on public.%I for all using (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''') with check (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''')',
      table_name || '_tenant_isolation',
      table_name
    );
  end loop;
end $$;

do $$
declare
  tenant_id text;
  admin_role_id text;
  permission_key text;
  permission_label text;
begin
  for tenant_id in select id from public."Tenant" loop
    for permission_key, permission_label in
      select *
      from (values
        ('training.sop_ack.view','View SOP acknowledgements'),
        ('training.sop_ack.dashboard.view','View SOP acknowledgement dashboard'),
        ('training.sop_ack.requirement.view','View SOP acknowledgement requirements'),
        ('training.sop_ack.requirement.create','Create SOP acknowledgement requirements'),
        ('training.sop_ack.requirement.edit','Edit SOP acknowledgement requirements'),
        ('training.sop_ack.requirement.archive','Archive SOP acknowledgement requirements'),
        ('training.sop_ack.requirement.activate','Activate SOP acknowledgement requirements'),
        ('training.sop_ack.assignment.view','View SOP acknowledgement assignments'),
        ('training.sop_ack.assignment.generate','Generate SOP acknowledgement assignments'),
        ('training.sop_ack.assignment.cancel','Cancel SOP acknowledgement assignments'),
        ('training.sop_ack.acknowledge','Acknowledge SOPs for workers'),
        ('training.sop_ack.acknowledge.self','Self acknowledge assigned SOPs'),
        ('training.sop_ack.verify','Verify SOP acknowledgements'),
        ('training.sop_ack.reject','Reject SOP acknowledgements'),
        ('training.sop_ack.return','Return SOP acknowledgements'),
        ('training.sop_ack.reopen','Reopen SOP acknowledgements'),
        ('training.sop_ack.request_reacknowledgement','Request SOP re-acknowledgement'),
        ('training.sop_ack.waiver.view','View SOP acknowledgement waivers'),
        ('training.sop_ack.waiver.request','Request SOP acknowledgement waivers'),
        ('training.sop_ack.waiver.approve','Approve SOP acknowledgement waivers'),
        ('training.sop_ack.waiver.reject','Reject SOP acknowledgement waivers'),
        ('training.sop_ack.waiver.revoke','Revoke SOP acknowledgement waivers'),
        ('training.sop_ack.matrix.sync','Sync SOP acknowledgement to Training Matrix'),
        ('training.sop_ack.competency.sync','Sync SOP acknowledgement to Competency'),
        ('training.sop_ack.import','Import SOP acknowledgements'),
        ('training.sop_ack.export','Export SOP acknowledgements'),
        ('training.sop_ack.history.view','View SOP acknowledgement history'),
        ('training.sop_ack.settings.view','View SOP acknowledgement settings'),
        ('training.sop_ack.settings.edit','Edit SOP acknowledgement settings')
      ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'TRAINING', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id and "key" = permission_key
      );
    end loop;

    select id into admin_role_id
    from public."Role"
    where "tenantId" = tenant_id
      and lower(name) in ('company admin', 'admin', 'administrator')
    order by case lower(name) when 'company admin' then 0 when 'admin' then 1 else 2 end
    limit 1;

    if admin_role_id is not null then
      insert into public."RolePermission" ("roleId", "permissionId")
      select admin_role_id, p.id
      from public."Permission" p
      where p."tenantId" = tenant_id
        and p."key" like 'training.sop_ack.%'
      on conflict do nothing;
    end if;
  end loop;
end $$;
