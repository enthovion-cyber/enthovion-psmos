create table if not exists public.training_pssr_readiness (
  id text primary key,
  company_id text not null,
  site_id text not null,
  unit_id text,
  area_id text,
  pssr_id text not null references public.pssrs(id) on delete cascade,
  readiness_code text,
  readiness_title text not null,
  readiness_source text not null default 'PSSR Impact Assessment',
  requirement_source text generated always as (readiness_source) stored,
  training_required boolean not null default true,
  training_required_reason text,
  impact_level text not null default 'Medium',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  ptw_critical boolean not null default false,
  startup_critical boolean not null default false,
  readiness_record_status text not null default 'Draft',
  readiness_status text not null default 'Not Assessed',
  pssr_approval_blocker boolean not null default false,
  handover_blocker boolean not null default false,
  startup_blocker boolean not null default false,
  owner_user_id text,
  due_date date,
  last_evaluated_at timestamptz,
  pssr_snapshot_json jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text
);

create table if not exists public.training_pssr_readiness_checks (
  id text primary key,
  company_id text not null,
  site_id text not null,
  pssr_id text not null references public.pssrs(id) on delete cascade,
  readiness_id text references public.training_pssr_readiness(id) on delete cascade,
  check_status text not null default 'Pending',
  check_result text not null default 'Manual Review Required',
  training_required boolean not null default false,
  sop_ack_required boolean not null default false,
  assessment_required boolean not null default false,
  certificate_required boolean not null default false,
  competency_required boolean not null default false,
  ptw_reauthorization_required boolean not null default false,
  moc_training_dependency_required boolean not null default false,
  manual_review_required boolean not null default false,
  readiness_answers_json jsonb,
  readiness_reasons_json jsonb,
  pssr_snapshot_json jsonb,
  checked_by text,
  checked_at timestamptz,
  stale_due_to_pssr_change boolean not null default false,
  stale_due_to_moc_change boolean not null default false,
  stale_due_to_psi_change boolean not null default false,
  stale_due_to_sop_change boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_pssr_readiness_training_links (
  id text primary key,
  company_id text not null,
  site_id text not null,
  readiness_id text not null references public.training_pssr_readiness(id) on delete cascade,
  training_item_id text,
  training_item_version text,
  matrix_rule_id text,
  competency_profile_id text,
  competency_readiness_id text,
  sop_ack_readiness_id text,
  assessment_id text,
  certificate_category text,
  link_type text not null default 'Required Training',
  required boolean not null default true,
  safety_critical boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.training_pssr_required_workers (
  id text primary key,
  company_id text not null,
  site_id text not null,
  unit_id text,
  area_id text,
  readiness_id text not null references public.training_pssr_readiness(id) on delete cascade,
  pssr_id text not null references public.pssrs(id) on delete cascade,
  worker_id text not null,
  worker_type text,
  employer_type text,
  contractor_company_name text,
  job_role text,
  competency_profile_id text,
  required_reason text not null,
  required_source text not null,
  safety_critical_affected boolean not null default false,
  ptw_affected boolean not null default false,
  pssr_startup_affected boolean not null default false,
  supervisor_user_id text,
  included boolean not null default true,
  excluded_reason text,
  added_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(readiness_id, worker_id)
);

create table if not exists public.training_pssr_assignments (
  id text primary key,
  company_id text not null,
  site_id text not null,
  unit_id text,
  area_id text,
  readiness_id text not null references public.training_pssr_readiness(id) on delete cascade,
  pssr_id text not null references public.pssrs(id) on delete cascade,
  worker_id text not null,
  required_worker_id text references public.training_pssr_required_workers(id) on delete set null,
  training_item_id text,
  training_item_version text,
  sop_ack_assignment_id text,
  assessment_assignment_id text,
  certificate_id text,
  competency_readiness_id text,
  matrix_assignment_id text,
  due_date date,
  assignment_status text not null default 'Assigned',
  completion_status text not null default 'Pending',
  evidence_status text not null default 'Missing Evidence',
  verification_status text not null default 'Not Required',
  overdue boolean not null default false,
  pssr_approval_blocker boolean not null default false,
  handover_blocker boolean not null default false,
  startup_blocker boolean not null default false,
  ptw_blocker boolean not null default false,
  action_id text,
  waiver_id text,
  last_evaluated_at timestamptz,
  recommended_action text,
  assigned_by text,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_by text,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_pssr_readiness_evaluations (
  id text primary key,
  company_id text not null,
  site_id text not null,
  unit_id text,
  area_id text,
  pssr_id text not null references public.pssrs(id) on delete cascade,
  readiness_id text references public.training_pssr_readiness(id) on delete cascade,
  readiness_status text not null default 'Not Assessed',
  total_workers integer not null default 0,
  completed_workers integer not null default 0,
  pending_workers integer not null default 0,
  overdue_workers integer not null default 0,
  waived_workers integer not null default 0,
  missing_training_count integer not null default 0,
  missing_sop_ack_count integer not null default 0,
  missing_assessment_count integer not null default 0,
  missing_certificate_count integer not null default 0,
  missing_competency_count integer not null default 0,
  pending_verification_count integer not null default 0,
  pssr_approval_blocker_count integer not null default 0,
  handover_blocker_count integer not null default 0,
  startup_blocker_count integer not null default 0,
  ptw_blocker_count integer not null default 0,
  safety_critical_gap_count integer not null default 0,
  evidence_package_status text,
  stale_due_to_pssr_change boolean not null default false,
  stale_due_to_moc_change boolean not null default false,
  stale_due_to_psi_change boolean not null default false,
  stale_due_to_sop_change boolean not null default false,
  result_summary_json jsonb,
  evaluated_by text,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_pssr_blockers (
  id text primary key,
  company_id text not null,
  site_id text not null,
  unit_id text,
  area_id text,
  pssr_id text not null references public.pssrs(id) on delete cascade,
  readiness_id text references public.training_pssr_readiness(id) on delete cascade,
  assignment_id text references public.training_pssr_assignments(id) on delete cascade,
  worker_id text,
  blocker_type text not null,
  blocker_title text not null,
  blocker_status text not null default 'Open',
  blocker_severity text not null default 'High',
  pssr_approval_blocker boolean not null default false,
  handover_blocker boolean not null default false,
  startup_blocker boolean not null default false,
  ptw_blocker boolean not null default false,
  due_date date,
  evidence_expected text,
  evidence_found text,
  owner_user_id text,
  action_id text,
  waiver_id text,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  verified_at timestamptz,
  verified_by text,
  handover_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_pssr_waivers (
  id text primary key,
  company_id text not null,
  site_id text not null,
  pssr_id text not null references public.pssrs(id) on delete cascade,
  readiness_id text references public.training_pssr_readiness(id) on delete cascade,
  assignment_id text references public.training_pssr_assignments(id) on delete set null,
  blocker_id text references public.training_pssr_blockers(id) on delete set null,
  worker_id text,
  waiver_type text not null default 'Temporary',
  waiver_reason text not null,
  risk_justification text,
  compensating_control text,
  expiry_date date,
  approval_status text not null default 'Requested',
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  revoked_by text,
  revoked_at timestamptz,
  revoke_reason text,
  esignature_status text,
  evidence_document_id text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_pssr_evaluation_runs (
  id text primary key,
  company_id text not null,
  site_id text,
  run_scope text not null,
  scope_record_id text,
  pssr_id text references public.pssrs(id) on delete cascade,
  readiness_id text references public.training_pssr_readiness(id) on delete cascade,
  triggered_by_type text not null default 'Manual',
  triggered_by_user_id text,
  triggered_by_module text,
  triggered_by_record_id text,
  status text not null default 'Completed',
  started_at timestamptz,
  completed_at timestamptz,
  total_requirements integer not null default 0,
  total_workers integer not null default 0,
  evaluated_workers integer not null default 0,
  assignments_created integer not null default 0,
  blockers_created integer not null default 0,
  blockers_resolved integer not null default 0,
  warnings_count integer not null default 0,
  errors_count integer not null default 0,
  error_message text,
  result_summary_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_pssr_history_events (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  pssr_id text,
  readiness_id text,
  assignment_id text,
  blocker_id text,
  worker_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'Training PSSR Requirements',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_pssr_settings (
  id text primary key,
  company_id text not null,
  site_id text,
  require_training_impact_check_for_pssr boolean not null default true,
  auto_create_training_requirement_from_pssr boolean not null default true,
  auto_generate_assignments boolean not null default false,
  block_pssr_approval_on_training_gap boolean not null default true,
  block_pssr_handover_on_training_gap boolean not null default true,
  block_pssr_startup_on_pssr_training_gap boolean not null default true,
  require_training_before_approval_for_high_risk_pssr boolean not null default true,
  require_training_before_startup_when_pssr_required boolean not null default true,
  auto_reevaluate_on_pssr_scope_change boolean not null default true,
  auto_notify_workers boolean not null default true,
  auto_notify_supervisors boolean not null default true,
  auto_notify_pssr_owner boolean not null default true,
  auto_create_actions_for_critical_gaps boolean not null default false,
  allow_safety_critical_waivers boolean not null default false,
  require_esign_for_blocker_waiver boolean not null default true,
  settings_json jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists training_pssr_readiness_scope_idx on public.training_pssr_readiness(company_id, site_id, pssr_id);
create index if not exists training_pssr_readiness_status_idx on public.training_pssr_readiness(readiness_status, readiness_record_status);
create index if not exists training_pssr_readiness_checks_pssr_idx on public.training_pssr_readiness_checks(pssr_id, check_status);
create index if not exists training_pssr_required_workers_req_worker_idx on public.training_pssr_required_workers(readiness_id, worker_id);
create index if not exists training_pssr_assignments_req_worker_idx on public.training_pssr_assignments(readiness_id, worker_id);
create index if not exists training_pssr_assignments_pssr_status_idx on public.training_pssr_assignments(pssr_id, assignment_status);
create index if not exists training_pssr_assignments_impl_idx on public.training_pssr_assignments(pssr_approval_blocker);
create index if not exists training_pssr_assignments_handover_idx on public.training_pssr_assignments(handover_blocker);
create index if not exists training_pssr_assignments_startup_idx on public.training_pssr_assignments(startup_blocker);
create index if not exists training_pssr_readiness_pssr_idx on public.training_pssr_readiness_evaluations(pssr_id, evaluated_at desc);
create index if not exists training_pssr_blockers_pssr_idx on public.training_pssr_blockers(pssr_id, blocker_status);
create index if not exists training_pssr_blockers_worker_idx on public.training_pssr_blockers(worker_id, blocker_type);
create index if not exists training_pssr_history_pssr_idx on public.training_pssr_history_events(pssr_id, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'training_pssr_readiness','training_pssr_readiness_checks','training_pssr_readiness_training_links',
    'training_pssr_required_workers','training_pssr_assignments','training_pssr_readiness_evaluations',
    'training_pssr_blockers','training_pssr_waivers','training_pssr_evaluation_runs',
    'training_pssr_history_events','training_pssr_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_policy', table_name);
    execute format(
      'create policy %I on public.%I for all using (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''') with check (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''')',
      table_name || '_tenant_policy',
      table_name
    );
  end loop;
end $$;

do $$
declare permission_key text;
declare permission_label text;
declare tenant_row record;
begin
  for permission_key, permission_label in
    select * from (values
      ('training.pssr.view','View PSSR training requirements'),
      ('training.pssr.dashboard.view','View PSSR training dashboard'),
      ('training.pssr.readiness.view','View PSSR training readiness'),
      ('training.pssr.readiness.create','Create PSSR training readiness'),
      ('training.pssr.readiness.edit','Edit PSSR training readiness'),
      ('training.pssr.readiness.archive','Archive PSSR training readiness'),
      ('training.pssr.impact_check.view','View PSSR training impact checks'),
      ('training.pssr.impact_check.run','Run PSSR training impact checks'),
      ('training.pssr.readiness_check.view','View PSSR training readiness checks'),
      ('training.pssr.readiness_check.run','Run PSSR training readiness checks'),
      ('training.pssr.required_workers.view','View PSSR affected workers'),
      ('training.pssr.required_workers.manage','Manage PSSR affected workers'),
      ('training.pssr.assignment.view','View PSSR training assignments'),
      ('training.pssr.assignment.generate','Generate PSSR training assignments'),
      ('training.pssr.assignment.cancel','Cancel PSSR training assignments'),
      ('training.pssr.readiness.run','Run PSSR training readiness'),
      ('training.pssr.blocker.view','View PSSR training blockers'),
      ('training.pssr.blocker.close','Close PSSR training blockers'),
      ('training.pssr.blocker.verify','Verify PSSR training blockers'),
      ('training.pssr.blocker.reopen','Reopen PSSR training blockers'),
      ('training.pssr.waiver.view','View PSSR training waivers'),
      ('training.pssr.waiver.request','Request PSSR training waivers'),
      ('training.pssr.waiver.approve','Approve PSSR training waivers'),
      ('training.pssr.waiver.reject','Reject PSSR training waivers'),
      ('training.pssr.waiver.revoke','Revoke PSSR training waivers'),
      ('training.pssr.evidence.view','View PSSR training evidence'),
      ('training.pssr.evidence.verify','Verify PSSR training evidence'),
      ('training.pssr.import','Import PSSR training requirements'),
      ('training.pssr.export','Export PSSR training requirements'),
      ('training.pssr.history.view','View PSSR training history'),
      ('training.pssr.settings.view','View PSSR training settings'),
      ('training.pssr.settings.edit','Edit PSSR training settings')
    ) as permissions(permission_key, permission_label)
  loop
    for tenant_row in select id from public."Tenant"
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'TRAINING', permission_label
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = tenant_row.id and p."key" = permission_key
      );
    end loop;
  end loop;

  insert into public."RolePermission" ("roleId", "permissionId")
  select r.id, p.id
  from public."Role" r
  join public."Permission" p on p."tenantId" = r."tenantId" and p."key" like 'training.pssr.%'
  where lower(r.name) in ('admin','administrator','company admin','super admin','tenant admin')
    and not exists (
      select 1 from public."RolePermission" rp
      where rp."roleId" = r.id and rp."permissionId" = p.id
    );
end $$;

