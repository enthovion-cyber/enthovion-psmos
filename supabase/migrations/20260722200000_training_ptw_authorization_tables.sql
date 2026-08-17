create table if not exists public.training_ptw_authorization_rules (
  id text primary key,
  company_id text not null,
  site_id text,
  rule_code text,
  rule_title text not null,
  description text,
  owner_user_id text,
  reviewer_user_id text,
  ptw_role text not null,
  permit_types_json jsonb not null default '[]'::jsonb,
  authorization_type text not null default 'Role Authorization',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  simops_critical boolean not null default false,
  gas_testing_required boolean not null default false,
  isolation_authority_required boolean not null default false,
  confined_space_role boolean not null default false,
  hot_work_role boolean not null default false,
  electrical_role boolean not null default false,
  contractor_role_allowed boolean not null default false,
  minimum_experience_requirement_json jsonb,
  rule_status text not null default 'Draft',
  review_status text default 'Not Reviewed',
  effective_date date,
  next_review_due date,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text
);

create table if not exists public.training_ptw_authorization_rule_scopes (
  id text primary key,
  company_id text not null,
  site_id text,
  rule_id text not null references public.training_ptw_authorization_rules(id) on delete cascade,
  scope_type text not null default 'Site',
  site_scope_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  department_id text,
  worker_type_filter text,
  employer_type_filter text,
  contractor_company_filter text,
  job_role_filter text,
  competency_profile_id text,
  required_training_item_id text,
  ptw_role_candidate boolean,
  specific_worker_id text,
  auto_evaluate_eligible_workers boolean not null default false,
  auto_generate_requests boolean not null default false,
  applicability_rule_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_evidence_rules (
  id text primary key,
  company_id text not null,
  site_id text,
  rule_id text not null references public.training_ptw_authorization_rules(id) on delete cascade,
  required_training_items_json jsonb,
  matrix_rule_ids_json jsonb,
  competency_requirement_ids_json jsonb,
  certificate_categories_json jsonb,
  assessment_ids_json jsonb,
  sop_ack_requirement_ids_json jsonb,
  training_completion_required boolean not null default true,
  matrix_status_required boolean not null default false,
  competency_status_required boolean not null default false,
  certificate_required boolean not null default false,
  assessment_required boolean not null default false,
  sop_ack_required boolean not null default false,
  practical_verification_required boolean not null default false,
  supervisor_approval_required boolean not null default false,
  hse_approval_required boolean not null default false,
  ptw_owner_approval_required boolean not null default false,
  evidence_document_required boolean not null default false,
  esign_required boolean not null default false,
  manual_verification_allowed boolean not null default false,
  evidence_validity_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_approval_rules (
  id text primary key,
  company_id text not null,
  site_id text,
  rule_id text not null references public.training_ptw_authorization_rules(id) on delete cascade,
  approval_required boolean not null default true,
  approval_route text not null default 'Supervisor / HSE / PTW Owner Approval',
  approver_role text,
  approver_user_id text,
  supervisor_approval_required boolean not null default false,
  hse_approval_required boolean not null default false,
  operations_manager_approval_required boolean not null default false,
  site_manager_approval_required boolean not null default false,
  ptw_coordinator_approval_required boolean not null default false,
  esign_required boolean not null default false,
  approval_sla_hours integer,
  escalation_rule_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_expiry_rules (
  id text primary key,
  company_id text not null,
  site_id text,
  rule_id text not null references public.training_ptw_authorization_rules(id) on delete cascade,
  no_expiry_allowed boolean not null default false,
  renewal_required boolean not null default true,
  renewal_interval_days integer,
  expiry_warning_days integer default 30,
  grace_period_days integer default 0,
  reauthorize_after_certificate_expiry boolean not null default true,
  reauthorize_after_assessment_failure boolean not null default true,
  reauthorize_after_sop_revision boolean not null default true,
  reauthorize_after_moc boolean not null default false,
  reauthorize_after_pssr_startup_change boolean not null default false,
  reauthorize_after_incident boolean not null default true,
  reauthorize_after_audit_finding boolean not null default true,
  reauthorize_after_psi_change boolean not null default false,
  suspension_rule_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_enforcement_rules (
  id text primary key,
  company_id text not null,
  site_id text,
  rule_id text not null references public.training_ptw_authorization_rules(id) on delete cascade,
  block_permit_creation_if_applicant_unauthorized boolean not null default false,
  block_permit_submission_if_applicant_unauthorized boolean not null default true,
  block_permit_issue_if_issuer_unauthorized boolean not null default true,
  block_permit_approval_if_approver_unauthorized boolean not null default true,
  block_gas_test_if_gas_tester_unauthorized boolean not null default true,
  block_isolation_signoff_if_isolator_unauthorized boolean not null default true,
  block_workforce_assignment_if_performing_authority_unauthorized boolean not null default true,
  block_confined_space_role_if_unauthorized boolean not null default true,
  block_hot_work_fire_watch_if_unauthorized boolean not null default true,
  block_shift_handover_if_receiver_unauthorized boolean not null default false,
  block_permit_closure_if_closure_authority_unauthorized boolean not null default false,
  warning_only_mode boolean not null default false,
  emergency_override_allowed boolean not null default false,
  override_approval_role text,
  override_max_duration_hours integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorizations (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  worker_id text not null references public.training_workers(id) on delete cascade,
  linked_user_id text,
  rule_id text references public.training_ptw_authorization_rules(id) on delete set null,
  ptw_role text not null,
  permit_types_json jsonb not null default '[]'::jsonb,
  authorization_scope_json jsonb,
  authorization_status text not null default 'Not Evaluated',
  evidence_status text not null default 'Missing Evidence',
  approval_status text not null default 'Not Submitted',
  effective_date date,
  expiry_date date,
  days_to_expiry integer,
  reauthorization_required boolean not null default false,
  reauthorization_reason text,
  authorized_by text,
  authorized_at timestamptz,
  last_evaluated_at timestamptz,
  suspended_by text,
  suspended_at timestamptz,
  suspension_reason text,
  revoked_by text,
  revoked_at timestamptz,
  revocation_reason text,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  waiver_id text,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text
);

create table if not exists public.training_ptw_authorization_requests (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  worker_id text not null references public.training_workers(id) on delete cascade,
  rule_id text references public.training_ptw_authorization_rules(id) on delete set null,
  requested_ptw_role text not null,
  requested_permit_types_json jsonb not null default '[]'::jsonb,
  requested_scope_json jsonb,
  request_source text not null default 'Manual',
  request_reason text,
  request_status text not null default 'Draft',
  evidence_checklist_json jsonb,
  gap_summary_json jsonb,
  reviewer_user_id text,
  approver_user_id text,
  due_date date,
  submitted_by text,
  submitted_at timestamptz,
  decided_by text,
  decided_at timestamptz,
  decision_reason text,
  converted_authorization_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_evaluations (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  worker_id text not null references public.training_workers(id) on delete cascade,
  authorization_id text references public.training_ptw_authorizations(id) on delete cascade,
  request_id text references public.training_ptw_authorization_requests(id) on delete cascade,
  rule_id text references public.training_ptw_authorization_rules(id) on delete set null,
  evaluation_run_id text,
  evaluation_status text not null default 'Completed',
  authorization_status text not null default 'Not Authorized',
  evidence_status text not null default 'Missing Evidence',
  approval_status text not null default 'Not Submitted',
  ptw_check_result text not null default 'Blocked',
  missing_training_count integer not null default 0,
  expired_certificate_count integer not null default 0,
  failed_assessment_count integer not null default 0,
  sop_ack_gap_count integer not null default 0,
  competency_gap_count integer not null default 0,
  matrix_gap_count integer not null default 0,
  blocker_count integer not null default 0,
  evidence_checklist_json jsonb,
  result_summary_json jsonb,
  evaluated_by text,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_gaps (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  worker_id text not null references public.training_workers(id) on delete cascade,
  authorization_id text references public.training_ptw_authorizations(id) on delete cascade,
  request_id text references public.training_ptw_authorization_requests(id) on delete cascade,
  rule_id text references public.training_ptw_authorization_rules(id) on delete set null,
  gap_type text not null,
  gap_title text not null,
  gap_status text not null default 'Open',
  gap_severity text not null default 'High',
  ptw_role text,
  permit_type text,
  ptw_action text,
  linked_ptw_id text,
  evidence_expected text,
  evidence_found text,
  due_date date,
  owner_user_id text,
  action_id text,
  waiver_id text,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz,
  resolution_notes text,
  verified_by text,
  verified_at timestamptz,
  reopened_by text,
  reopened_at timestamptz,
  reopen_reason text
);

create table if not exists public.training_ptw_authorization_waivers (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  worker_id text not null references public.training_workers(id) on delete cascade,
  authorization_id text references public.training_ptw_authorizations(id) on delete cascade,
  request_id text references public.training_ptw_authorization_requests(id) on delete cascade,
  gap_id text references public.training_ptw_authorization_gaps(id) on delete cascade,
  waiver_type text not null default 'Temporary Authorization',
  waiver_status text not null default 'Requested',
  requested_ptw_role text,
  requested_scope_json jsonb,
  reason text not null,
  risk_justification text,
  compensating_controls text,
  expiry_date timestamptz,
  requested_by text,
  requested_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  revoked_by text,
  revoked_at timestamptz,
  decision_reason text,
  esignature_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_check_logs (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  worker_id text,
  linked_user_id text,
  authorization_id text,
  rule_id text,
  ptw_id text,
  ptw_role text,
  permit_type text,
  ptw_action text,
  check_result text not null,
  blocked boolean not null default false,
  disabled_reason text,
  evidence_status text,
  authorization_status text,
  metadata_json jsonb,
  checked_by text,
  checked_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_history_events (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  worker_id text,
  authorization_id text,
  rule_id text,
  request_id text,
  gap_id text,
  waiver_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'PTW Role Authorization',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_ptw_authorization_settings (
  id text primary key,
  company_id text not null,
  site_id text,
  auto_evaluate_on_worker_change boolean not null default true,
  auto_evaluate_on_rule_change boolean not null default true,
  block_ptw_on_missing_authorization boolean not null default true,
  expire_authorization_on_certificate_expiry boolean not null default true,
  suspend_authorization_on_failed_assessment boolean not null default true,
  allow_emergency_override boolean not null default false,
  require_esign_for_safety_critical_authorization boolean not null default true,
  default_expiry_warning_days integer not null default 30,
  settings_json jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists training_ptw_auth_rules_company_site_idx on public.training_ptw_authorization_rules(company_id, site_id, rule_status);
create index if not exists training_ptw_auth_rules_role_idx on public.training_ptw_authorization_rules(ptw_role, authorization_type);
create index if not exists training_ptw_auth_records_worker_idx on public.training_ptw_authorizations(company_id, worker_id, ptw_role, authorization_status);
create index if not exists training_ptw_auth_records_scope_idx on public.training_ptw_authorizations(company_id, site_id, unit_id, area_id, equipment_id);
create index if not exists training_ptw_auth_requests_status_idx on public.training_ptw_authorization_requests(company_id, request_status, due_date);
create index if not exists training_ptw_auth_evals_worker_idx on public.training_ptw_authorization_evaluations(company_id, worker_id, evaluated_at desc);
create index if not exists training_ptw_auth_gaps_status_idx on public.training_ptw_authorization_gaps(company_id, gap_status, gap_type);
create index if not exists training_ptw_auth_waivers_status_idx on public.training_ptw_authorization_waivers(company_id, waiver_status, expiry_date);
create index if not exists training_ptw_auth_check_logs_ptw_idx on public.training_ptw_authorization_check_logs(company_id, ptw_id, checked_at desc);
create index if not exists training_ptw_auth_history_idx on public.training_ptw_authorization_history_events(company_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_ptw_authorization_rules',
    'training_ptw_authorization_rule_scopes',
    'training_ptw_authorization_evidence_rules',
    'training_ptw_authorization_approval_rules',
    'training_ptw_authorization_expiry_rules',
    'training_ptw_authorization_enforcement_rules',
    'training_ptw_authorizations',
    'training_ptw_authorization_requests',
    'training_ptw_authorization_evaluations',
    'training_ptw_authorization_gaps',
    'training_ptw_authorization_waivers',
    'training_ptw_authorization_check_logs',
    'training_ptw_authorization_history_events',
    'training_ptw_authorization_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    if not exists (
      select 1
      from pg_policies
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
  end loop;
end $$;

do $$
declare
  permission_key text;
  permission_label text;
  permission_item text[];
  tenant_row record;
  permissions text[][] := array[
    array['training.ptw_authorization.view','View PTW role authorization'],
    array['training.ptw_authorization.dashboard.view','View PTW authorization dashboard'],
    array['training.ptw_authorization.rule.view','View PTW authorization rules'],
    array['training.ptw_authorization.rule.create','Create PTW authorization rules'],
    array['training.ptw_authorization.rule.edit','Edit PTW authorization rules'],
    array['training.ptw_authorization.rule.archive','Archive PTW authorization rules'],
    array['training.ptw_authorization.rule.activate','Activate PTW authorization rules'],
    array['training.ptw_authorization.rule.evaluate','Evaluate PTW authorization rule workers'],
    array['training.ptw_authorization.rule.generate_requests','Generate PTW authorization requests'],
    array['training.ptw_authorization.record.view','View PTW authorization records'],
    array['training.ptw_authorization.record.create','Create PTW authorization records'],
    array['training.ptw_authorization.record.edit','Edit PTW authorization records'],
    array['training.ptw_authorization.record.evaluate','Evaluate PTW authorization records'],
    array['training.ptw_authorization.record.submit_approval','Submit PTW authorization approval'],
    array['training.ptw_authorization.record.approve','Approve PTW authorization records'],
    array['training.ptw_authorization.record.reject','Reject PTW authorization records'],
    array['training.ptw_authorization.record.renew','Renew PTW authorization records'],
    array['training.ptw_authorization.record.suspend','Suspend PTW authorization records'],
    array['training.ptw_authorization.record.revoke','Revoke PTW authorization records'],
    array['training.ptw_authorization.request.view','View PTW authorization requests'],
    array['training.ptw_authorization.request.create','Create PTW authorization requests'],
    array['training.ptw_authorization.request.edit','Edit PTW authorization requests'],
    array['training.ptw_authorization.request.submit','Submit PTW authorization requests'],
    array['training.ptw_authorization.request.approve','Approve PTW authorization requests'],
    array['training.ptw_authorization.request.reject','Reject PTW authorization requests'],
    array['training.ptw_authorization.request.return','Return PTW authorization requests'],
    array['training.ptw_authorization.evaluation.view','View PTW authorization evaluations'],
    array['training.ptw_authorization.evaluation.run','Run PTW authorization evaluations'],
    array['training.ptw_authorization.check.run','Run PTW authorization checks'],
    array['training.ptw_authorization.gap.view','View PTW authorization gaps'],
    array['training.ptw_authorization.gap.close','Close PTW authorization gaps'],
    array['training.ptw_authorization.gap.verify','Verify PTW authorization gaps'],
    array['training.ptw_authorization.gap.reopen','Reopen PTW authorization gaps'],
    array['training.ptw_authorization.waiver.view','View PTW authorization waivers'],
    array['training.ptw_authorization.waiver.request','Request PTW authorization waivers'],
    array['training.ptw_authorization.waiver.approve','Approve PTW authorization waivers'],
    array['training.ptw_authorization.waiver.reject','Reject PTW authorization waivers'],
    array['training.ptw_authorization.waiver.revoke','Revoke PTW authorization waivers'],
    array['training.ptw_authorization.import','Import PTW authorization data'],
    array['training.ptw_authorization.export','Export PTW authorization data'],
    array['training.ptw_authorization.history.view','View PTW authorization history'],
    array['training.ptw_authorization.settings.view','View PTW authorization settings'],
    array['training.ptw_authorization.settings.edit','Edit PTW authorization settings']
  ];
begin
  foreach permission_item slice 1 in array permissions loop
    permission_key := permission_item[1];
    permission_label := permission_item[2];
    for tenant_row in select id from public."Tenant" loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'Training', permission_label
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = tenant_row.id and p."key" = permission_key
      );
    end loop;
  end loop;

  insert into public."RolePermission" ("roleId", "permissionId")
  select r.id, p.id
  from public."Role" r
  join public."Permission" p on p."tenantId" = r."tenantId" and p."key" like 'training.ptw_authorization.%'
  where lower(coalesce(r.name, '')) in ('admin','administrator','company admin','super admin','owner')
    and not exists (
      select 1 from public."RolePermission" rp
      where rp."roleId" = r.id and rp."permissionId" = p.id
    );
end $$;
