-- Training & Competency Phase 5 - Training Records + Attendance.

create table if not exists public.training_sessions (
  id text primary key,
  company_id text not null,
  site_id text not null,
  unit_id text null,
  area_id text null,
  department_id text null,
  session_code text null,
  session_title text not null,
  session_type text not null default 'Classroom',
  description text null,
  training_item_id text null references public.training_required_items(id) on delete set null,
  training_item_version text null,
  training_category text null,
  training_type text null,
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  ptw_critical boolean not null default false,
  moc_critical boolean not null default false,
  pssr_critical boolean not null default false,
  start_time timestamptz null,
  end_time timestamptz null,
  timezone text null,
  location text null,
  online_meeting_link text null,
  room_area text null,
  capacity integer null,
  attendance_cutoff_time timestamptz null,
  attendance_method text not null default 'Manual attendance',
  session_status text not null default 'Draft',
  approval_status text not null default 'Draft',
  owner_user_id text null,
  instructor_worker_id text null references public.training_workers(id) on delete set null,
  instructor_user_id text null,
  external_instructor_name text null,
  external_provider_company text null,
  instructor_qualification_document_id text null,
  instructor_email text null,
  instructor_phone text null,
  instructor_approval_status text null,
  cancellation_reason text null,
  evidence_rules_json jsonb not null default '{}'::jsonb,
  linked_records_json jsonb not null default '[]'::jsonb,
  readiness_status text not null default 'Warning',
  readiness_blockers_json jsonb not null default '[]'::jsonb,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  constraint training_sessions_code_scope_uniq unique(company_id, site_id, session_code)
);

create table if not exists public.training_session_roster (
  id text primary key,
  company_id text not null,
  site_id text not null,
  session_id text not null references public.training_sessions(id) on delete cascade,
  worker_id text not null references public.training_workers(id) on delete cascade,
  unit_id text null,
  area_id text null,
  job_role text null,
  worker_type text null,
  employer_type text null,
  contractor_company_name text null,
  required_because text null,
  matrix_assignment_id text null,
  matrix_gap_id text null,
  competency_requirement_id text null,
  competency_gap_id text null,
  linked_moc_id text null,
  linked_pssr_id text null,
  linked_ptw_id text null,
  roster_status text not null default 'Added',
  invited_at timestamptz null,
  confirmed_at timestamptz null,
  removed_at timestamptz null,
  removed_by text null,
  remove_reason text null,
  notes text null,
  added_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_attendance_records (
  id text primary key,
  company_id text not null,
  site_id text not null,
  session_id text not null references public.training_sessions(id) on delete cascade,
  worker_id text not null references public.training_workers(id) on delete cascade,
  roster_id text null references public.training_session_roster(id) on delete set null,
  attendance_status text not null default 'Pending',
  check_in_time timestamptz null,
  check_out_time timestamptz null,
  attendance_duration_minutes integer null,
  attendance_percentage numeric null,
  completion_candidate boolean not null default false,
  absence_reason text null,
  incomplete_reason text null,
  evidence_note text null,
  attendance_locked boolean not null default false,
  recorded_by text null,
  recorded_at timestamptz null,
  submitted_by text null,
  submitted_at timestamptz null,
  corrected_by text null,
  corrected_at timestamptz null,
  correction_reason text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_completion_records (
  id text primary key,
  company_id text not null,
  site_id text not null,
  unit_id text null,
  area_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  session_id text null references public.training_sessions(id) on delete set null,
  attendance_record_id text null references public.training_attendance_records(id) on delete set null,
  training_item_id text null references public.training_required_items(id) on delete set null,
  training_item_version text null,
  training_code text null,
  training_title text null,
  training_category text null,
  completion_status text not null default 'Not Started',
  completion_date date null,
  due_date date null,
  expiry_date date null,
  attendance_status text null,
  evidence_status text not null default 'Not Required',
  verification_status text not null default 'Not Required',
  approval_status text not null default 'Not Required',
  instructor_worker_id text null,
  instructor_user_id text null,
  external_provider_company text null,
  score_summary text null,
  certificate_id text null,
  assessment_result_id text null,
  sop_acknowledgement_id text null,
  matrix_assignment_id text null,
  matrix_gap_id text null,
  competency_requirement_id text null,
  competency_gap_id text null,
  ptw_blocker_id text null,
  moc_training_requirement_id text null,
  pssr_training_blocker_id text null,
  manually_entered boolean not null default false,
  manual_entry_reason text null,
  manually_verified boolean not null default false,
  manual_verification_reason text null,
  verified_by text null,
  verified_at timestamptz null,
  approved_by text null,
  approved_at timestamptz null,
  reopened_by text null,
  reopened_at timestamptz null,
  reopen_reason text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.training_record_evidence_documents (
  id text primary key,
  company_id text not null,
  site_id text not null,
  completion_record_id text null references public.training_completion_records(id) on delete cascade,
  session_id text null references public.training_sessions(id) on delete cascade,
  attendance_record_id text null references public.training_attendance_records(id) on delete cascade,
  document_id text not null,
  document_type text not null default 'Document Control',
  document_number text null,
  document_title text null,
  document_status text null,
  document_revision text null,
  evidence_type text not null default 'Document Control evidence',
  evidence_status text not null default 'Provided',
  required boolean not null default false,
  verified_by text null,
  verified_at timestamptz null,
  rejected_by text null,
  rejected_at timestamptz null,
  rejection_reason text null,
  snapshot_json jsonb not null default '{}'::jsonb,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.training_record_links (
  id text primary key,
  company_id text not null,
  site_id text not null,
  completion_record_id text null references public.training_completion_records(id) on delete cascade,
  session_id text null references public.training_sessions(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_title text null,
  relationship_type text not null default 'Related training evidence',
  relationship_reason text null,
  required boolean not null default false,
  safety_critical boolean not null default false,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.training_record_verifications (
  id text primary key,
  company_id text not null,
  site_id text not null,
  completion_record_id text not null references public.training_completion_records(id) on delete cascade,
  verification_type text not null default 'Instructor verification',
  verification_status text not null default 'Pending',
  verifier_user_id text null,
  verifier_role text null,
  verification_comment text null,
  rejection_reason text null,
  override_reason text null,
  esignature_id text null,
  verified_at timestamptz null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_attendance_import_jobs (
  id text primary key,
  company_id text not null,
  site_id text null,
  session_id text null references public.training_sessions(id) on delete set null,
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
  preview_json jsonb not null default '[]'::jsonb,
  error_report_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_record_status_updates (
  id text primary key,
  company_id text not null,
  site_id text not null,
  completion_record_id text not null references public.training_completion_records(id) on delete cascade,
  old_completion_status text null,
  new_completion_status text not null,
  old_evidence_status text null,
  new_evidence_status text null,
  old_verification_status text null,
  new_verification_status text null,
  old_approval_status text null,
  new_approval_status text null,
  update_reason text not null,
  updated_by text null,
  updated_at timestamptz not null default now()
);

create table if not exists public.training_record_history_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text null,
  session_id text null,
  completion_record_id text null,
  attendance_record_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'Training Records',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_record_settings (
  id text primary key,
  company_id text not null,
  site_id text null,
  require_reason_for_manual_record boolean not null default true,
  require_reason_for_attendance_correction boolean not null default true,
  lock_attendance_after_submit boolean not null default true,
  lock_completion_after_verification boolean not null default true,
  require_verification_for_safety_critical boolean not null default true,
  require_approval_for_safety_critical boolean not null default false,
  allow_manual_completion_for_safety_critical boolean not null default false,
  auto_update_matrix_on_verified_completion boolean not null default true,
  auto_update_competency_on_verified_completion boolean not null default true,
  auto_clear_blockers_on_verified_completion boolean not null default true,
  auto_notify_worker_on_completion boolean not null default true,
  auto_notify_supervisor_on_absence boolean not null default true,
  settings_json jsonb not null default '{}'::jsonb,
  updated_by text null,
  updated_at timestamptz not null default now(),
  constraint training_record_settings_scope_uniq unique(company_id, site_id)
);

create index if not exists training_sessions_company_site_idx on public.training_sessions(company_id, site_id, session_status);
create index if not exists training_sessions_training_item_idx on public.training_sessions(training_item_id, start_time);
create index if not exists training_sessions_owner_idx on public.training_sessions(company_id, owner_user_id);
create index if not exists training_session_roster_session_worker_idx on public.training_session_roster(session_id, worker_id);
create index if not exists training_session_roster_worker_idx on public.training_session_roster(company_id, worker_id);
create unique index if not exists training_session_roster_active_unique on public.training_session_roster(session_id, worker_id) where removed_at is null;
create index if not exists training_attendance_records_session_worker_idx on public.training_attendance_records(session_id, worker_id);
create index if not exists training_attendance_records_status_idx on public.training_attendance_records(company_id, attendance_status);
create unique index if not exists training_attendance_records_unique on public.training_attendance_records(session_id, worker_id);
create index if not exists training_completion_records_worker_idx on public.training_completion_records(company_id, site_id, worker_id);
create index if not exists training_completion_records_training_idx on public.training_completion_records(training_item_id, training_item_version);
create index if not exists training_completion_records_completion_idx on public.training_completion_records(company_id, completion_status);
create index if not exists training_completion_records_evidence_verification_idx on public.training_completion_records(evidence_status, verification_status);
create index if not exists training_completion_records_expiry_idx on public.training_completion_records(expiry_date);
create index if not exists training_record_evidence_documents_record_idx on public.training_record_evidence_documents(completion_record_id, document_id);
create index if not exists training_record_evidence_documents_session_idx on public.training_record_evidence_documents(session_id);
create index if not exists training_record_links_record_module_idx on public.training_record_links(completion_record_id, linked_module);
create index if not exists training_record_links_session_module_idx on public.training_record_links(session_id, linked_module);
create index if not exists training_record_verifications_record_idx on public.training_record_verifications(completion_record_id, verification_status);
create index if not exists training_record_history_events_record_created_idx on public.training_record_history_events(completion_record_id, created_at desc);
create index if not exists training_record_history_events_session_created_idx on public.training_record_history_events(session_id, created_at desc);
create index if not exists training_record_history_events_worker_created_idx on public.training_record_history_events(worker_id, created_at desc);

alter table public.training_sessions enable row level security;
alter table public.training_session_roster enable row level security;
alter table public.training_attendance_records enable row level security;
alter table public.training_completion_records enable row level security;
alter table public.training_record_evidence_documents enable row level security;
alter table public.training_record_links enable row level security;
alter table public.training_record_verifications enable row level security;
alter table public.training_attendance_import_jobs enable row level security;
alter table public.training_record_status_updates enable row level security;
alter table public.training_record_history_events enable row level security;
alter table public.training_record_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_sessions',
    'training_session_roster',
    'training_attendance_records',
    'training_completion_records',
    'training_record_evidence_documents',
    'training_record_links',
    'training_record_verifications',
    'training_attendance_import_jobs',
    'training_record_status_updates',
    'training_record_history_events',
    'training_record_settings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_policy', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (company_id = coalesce(auth.jwt() ->> ''tenantId'', auth.jwt() ->> ''tenant_id'', '''')) with check (company_id = coalesce(auth.jwt() ->> ''tenantId'', auth.jwt() ->> ''tenant_id'', ''''))',
      table_name || '_tenant_policy',
      table_name
    );
  end loop;
end $$;

grant select, insert, update, delete on public.training_sessions to authenticated;
grant select, insert, update, delete on public.training_session_roster to authenticated;
grant select, insert, update, delete on public.training_attendance_records to authenticated;
grant select, insert, update, delete on public.training_completion_records to authenticated;
grant select, insert, update, delete on public.training_record_evidence_documents to authenticated;
grant select, insert, update, delete on public.training_record_links to authenticated;
grant select, insert, update, delete on public.training_record_verifications to authenticated;
grant select, insert, update on public.training_attendance_import_jobs to authenticated;
grant select, insert on public.training_record_status_updates to authenticated;
grant select, insert on public.training_record_history_events to authenticated;
grant select, insert, update on public.training_record_settings to authenticated;

do $$
declare
  tenant_row record;
  permission_row record;
  permission_id text;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_row in
      select * from (values
        ('training.records.view', 'View Training Records'),
        ('training.records.dashboard.view', 'View Training Records dashboard'),
        ('training.records.session.view', 'View training sessions'),
        ('training.records.session.create', 'Create training sessions'),
        ('training.records.session.edit', 'Edit training sessions'),
        ('training.records.session.cancel', 'Cancel training sessions'),
        ('training.records.session.archive', 'Archive training sessions'),
        ('training.records.roster.view', 'View training rosters'),
        ('training.records.roster.manage', 'Manage training rosters'),
        ('training.records.attendance.view', 'View training attendance'),
        ('training.records.attendance.record', 'Record training attendance'),
        ('training.records.attendance.submit', 'Submit training attendance'),
        ('training.records.attendance.lock', 'Lock training attendance'),
        ('training.records.attendance.correct', 'Correct training attendance'),
        ('training.records.completion.view', 'View completion records'),
        ('training.records.completion.create', 'Create completion records'),
        ('training.records.completion.edit', 'Edit completion records'),
        ('training.records.completion.manual_entry', 'Enter manual completion records'),
        ('training.records.completion.verify', 'Verify completion records'),
        ('training.records.completion.approve', 'Approve completion records'),
        ('training.records.completion.reject', 'Reject completion records'),
        ('training.records.completion.reopen', 'Reopen completion records'),
        ('training.records.evidence.link', 'Link completion evidence'),
        ('training.records.evidence.remove', 'Remove completion evidence'),
        ('training.records.evidence.verify', 'Verify completion evidence'),
        ('training.records.import', 'Import attendance and records'),
        ('training.records.export', 'Export training records'),
        ('training.records.history.view', 'View training record history'),
        ('training.records.settings.view', 'View training record settings'),
        ('training.records.settings.edit', 'Edit training record settings')
      ) as p(key, label)
    loop
      permission_id := 'perm_' || replace(tenant_row.id || '_' || permission_row.key, '.', '_');
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      values (permission_id, tenant_row.id, permission_row.key, 'training', permission_row.label)
      on conflict ("id") do update set "key" = excluded."key", "moduleKey" = excluded."moduleKey", "label" = excluded."label";
    end loop;
  end loop;
end $$;

insert into public."RolePermission" ("roleId", "permissionId")
select r.id, p.id
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId" and p."moduleKey" = 'training'
where lower(r.key) like '%admin%' or lower(r.name) like '%admin%'
on conflict do nothing;
