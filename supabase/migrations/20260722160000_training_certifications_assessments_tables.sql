-- Training & Competency Phase 6 + 7 - Certifications, Expiry Tracking, Assessments and Quizzes.
-- Uses text ids to match the existing Training module tables.

create table if not exists public.training_certificates (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  certificate_title text not null,
  certificate_code text null,
  certificate_number text null,
  certificate_category text not null,
  issuer_provider text null,
  external_provider boolean not null default false,
  description text null,
  notes text null,
  issue_date date null,
  effective_date date null,
  expiry_date date null,
  no_expiry boolean not null default false,
  renewal_required boolean not null default false,
  renewal_interval_days integer null,
  expiry_warning_days integer null,
  grace_period_days integer null,
  certificate_status text not null default 'Draft',
  verification_status text not null default 'Pending',
  evidence_status text not null default 'Missing',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  ptw_critical boolean not null default false,
  moc_critical boolean not null default false,
  pssr_critical boolean not null default false,
  training_item_id text null references public.training_required_items(id) on delete set null,
  training_item_version text null,
  completion_record_id text null references public.training_completion_records(id) on delete set null,
  competency_profile_id text null,
  competency_requirement_id text null,
  matrix_assignment_id text null,
  matrix_gap_id text null,
  previous_certificate_id text null references public.training_certificates(id) on delete set null,
  superseded_by_certificate_id text null references public.training_certificates(id) on delete set null,
  verified_by text null,
  verified_at timestamptz null,
  rejected_by text null,
  rejected_at timestamptz null,
  rejection_reason text null,
  revoked_by text null,
  revoked_at timestamptz null,
  revoke_reason text null,
  override_reason text null,
  created_by text not null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  constraint training_cert_expiry_after_issue check (no_expiry or expiry_date is null or issue_date is null or expiry_date > issue_date)
);

create table if not exists public.training_certificate_documents (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  certificate_id text not null references public.training_certificates(id) on delete cascade,
  document_id text not null,
  document_type text not null default 'Certificate document',
  evidence_status text not null default 'Linked',
  required boolean not null default true,
  linked_by text not null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.training_certificate_renewals (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  certificate_id text not null references public.training_certificates(id) on delete cascade,
  old_certificate_id text null references public.training_certificates(id) on delete set null,
  new_certificate_id text null references public.training_certificates(id) on delete set null,
  renewal_status text not null default 'Due',
  renewal_due_date date null,
  renewal_completed_at timestamptz null,
  renewal_reason text null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_assessments (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  assessment_code text not null,
  assessment_title text not null,
  assessment_type text not null,
  assessment_category text not null,
  description text null,
  instructions text null,
  owner_user_id text null,
  reviewer_user_id text null,
  version text not null default '1.0',
  assessment_status text not null default 'Draft',
  review_status text null default 'Draft',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  ptw_critical boolean not null default false,
  moc_critical boolean not null default false,
  pssr_critical boolean not null default false,
  passing_score numeric null,
  max_score numeric null,
  time_limit_minutes integer null,
  attempt_limit integer null,
  retake_allowed boolean not null default true,
  retake_waiting_period_hours integer null,
  randomize_questions boolean not null default false,
  show_answers_after_completion boolean not null default false,
  manual_grading_required boolean not null default false,
  evidence_document_required boolean not null default false,
  supervisor_signoff_required boolean not null default false,
  hse_verification_required boolean not null default false,
  esign_required boolean not null default false,
  validity_days integer null,
  training_item_id text null references public.training_required_items(id) on delete set null,
  training_item_version text null,
  competency_profile_id text null,
  competency_requirement_id text null,
  linked_sop_id text null,
  linked_psi_module text null,
  linked_psi_record_id text null,
  created_by text not null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  constraint training_assessment_passing_lte_max check (passing_score is null or max_score is null or passing_score <= max_score)
);

create table if not exists public.training_assessment_questions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  assessment_id text not null references public.training_assessments(id) on delete cascade,
  question_order integer not null default 1,
  question_text text not null,
  question_type text not null,
  options_json jsonb null,
  correct_answer_json jsonb null,
  score_weight numeric not null default 1,
  required boolean not null default true,
  safety_critical boolean not null default false,
  explanation text null,
  related_training_section_id text null,
  related_sop_id text null,
  related_psi_module text null,
  related_psi_record_id text null,
  created_by text not null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz null,
  removed_by text null
);

create table if not exists public.training_assessment_assignments (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  assessment_id text not null references public.training_assessments(id) on delete cascade,
  training_item_id text null references public.training_required_items(id) on delete set null,
  completion_record_id text null references public.training_completion_records(id) on delete set null,
  competency_requirement_id text null,
  matrix_gap_id text null,
  competency_gap_id text null,
  linked_ptw_id text null,
  linked_moc_id text null,
  linked_pssr_id text null,
  assignment_source text not null default 'Manual assignment',
  required_because text null,
  due_date date null,
  attempt_limit integer null,
  assignment_status text not null default 'Assigned',
  assigned_by text not null,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz null,
  cancelled_by text null,
  cancelled_at timestamptz null,
  cancel_reason text null
);

create table if not exists public.training_assessment_attempts (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  assessment_id text not null references public.training_assessments(id) on delete cascade,
  assignment_id text null references public.training_assessment_assignments(id) on delete set null,
  attempt_number integer not null default 1,
  attempt_status text not null default 'Not Started',
  started_at timestamptz null,
  submitted_at timestamptz null,
  graded_at timestamptz null,
  verified_at timestamptz null,
  score numeric null,
  max_score numeric null,
  passing_score numeric null,
  passed boolean null,
  time_spent_seconds integer null,
  manual_grading_status text null,
  verification_status text null,
  graded_by text null,
  verified_by text null,
  rejection_reason text null,
  reopen_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_assessment_answers (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  attempt_id text not null references public.training_assessment_attempts(id) on delete cascade,
  question_id text not null references public.training_assessment_questions(id) on delete cascade,
  answer_json jsonb null,
  answer_text text null,
  evidence_document_id text null,
  score_awarded numeric null,
  is_correct boolean null,
  grading_comment text null,
  graded_by text null,
  graded_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists public.training_assessment_results (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  assessment_id text not null references public.training_assessments(id) on delete cascade,
  assignment_id text null references public.training_assessment_assignments(id) on delete set null,
  attempt_id text not null references public.training_assessment_attempts(id) on delete cascade,
  result_status text not null default 'Pending',
  score numeric null,
  max_score numeric null,
  passing_score numeric null,
  passed boolean not null default false,
  completion_date date null,
  expiry_date date null,
  evidence_status text null,
  verification_status text null,
  training_item_id text null,
  completion_record_id text null,
  competency_requirement_id text null,
  matrix_gap_id text null,
  competency_gap_id text null,
  verified_by text null,
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_cert_assessment_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text null,
  certificate_id text null,
  assessment_id text null,
  attempt_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'Training Certifications / Assessments',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_cert_assessment_settings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  default_certificate_expiry_warning_days integer not null default 60,
  default_assessment_due_warning_days integer not null default 14,
  require_certificate_evidence boolean not null default true,
  require_verification_for_safety_critical_certificates boolean not null default true,
  require_verification_for_safety_critical_assessments boolean not null default true,
  auto_update_matrix_on_certificate_verify boolean not null default true,
  auto_update_competency_on_certificate_verify boolean not null default true,
  auto_update_matrix_on_assessment_pass boolean not null default true,
  auto_update_competency_on_assessment_pass boolean not null default true,
  auto_reopen_gaps_on_certificate_expiry boolean not null default true,
  auto_notify_expiring_certificates boolean not null default true,
  auto_notify_failed_assessments boolean not null default true,
  require_esign_for_safety_critical_override boolean not null default true,
  settings_json jsonb null,
  updated_by text null,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists training_certificates_company_site_worker_idx on public.training_certificates(company_id, site_id, worker_id);
create index if not exists training_certificates_expiry_status_idx on public.training_certificates(expiry_date, certificate_status);
create index if not exists training_certificates_training_item_idx on public.training_certificates(training_item_id);
create index if not exists training_certificates_comp_req_idx on public.training_certificates(competency_requirement_id);
create index if not exists training_certificate_documents_cert_idx on public.training_certificate_documents(certificate_id, removed_at);
create index if not exists training_assessments_company_site_status_idx on public.training_assessments(company_id, site_id, assessment_status);
create index if not exists training_assessment_questions_assessment_idx on public.training_assessment_questions(assessment_id, question_order);
create index if not exists training_assessment_assignments_worker_status_idx on public.training_assessment_assignments(worker_id, assignment_status);
create index if not exists training_assessment_attempts_worker_assessment_idx on public.training_assessment_attempts(worker_id, assessment_id);
create index if not exists training_assessment_results_worker_status_idx on public.training_assessment_results(worker_id, result_status);
create index if not exists training_cert_assessment_history_worker_idx on public.training_cert_assessment_history_events(worker_id, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'training_certificates',
    'training_certificate_documents',
    'training_certificate_renewals',
    'training_assessments',
    'training_assessment_questions',
    'training_assessment_assignments',
    'training_assessment_attempts',
    'training_assessment_answers',
    'training_assessment_results',
    'training_cert_assessment_history_events',
    'training_cert_assessment_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_select', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (company_id in (select "tenantId" from public."UserTenant" where "userId" = (select auth.uid())::text))', table_name || '_tenant_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_mutate', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (company_id in (select "tenantId" from public."UserTenant" where "userId" = (select auth.uid())::text)) with check (company_id in (select "tenantId" from public."UserTenant" where "userId" = (select auth.uid())::text))', table_name || '_tenant_mutate', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
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
        ('training.certifications.view','View certifications'),
        ('training.certifications.dashboard.view','View certifications dashboard'),
        ('training.certifications.create','Create training certificates'),
        ('training.certifications.edit','Edit training certificates'),
        ('training.certifications.verify','Verify training certificates'),
        ('training.certifications.reject','Reject training certificates'),
        ('training.certifications.renew','Renew training certificates'),
        ('training.certifications.revoke','Revoke training certificates'),
        ('training.certifications.archive','Archive training certificates'),
        ('training.certifications.link_document','Link certificate documents'),
        ('training.certifications.remove_document','Remove certificate documents'),
        ('training.certifications.import','Import training certificates'),
        ('training.certifications.export','Export training certificates'),
        ('training.certifications.settings.view','View certificate settings'),
        ('training.certifications.settings.edit','Edit certificate settings'),
        ('training.assessments.view','View assessments'),
        ('training.assessments.dashboard.view','View assessment dashboard'),
        ('training.assessments.library.view','View assessment library'),
        ('training.assessments.library.create','Create assessments'),
        ('training.assessments.library.edit','Edit assessments'),
        ('training.assessments.library.archive','Archive assessments'),
        ('training.assessments.questions.manage','Manage assessment questions'),
        ('training.assessments.assign','Assign assessments'),
        ('training.assessments.take','Take assessments'),
        ('training.assessments.grade','Grade assessments'),
        ('training.assessments.verify','Verify assessments'),
        ('training.assessments.reopen','Reopen assessments'),
        ('training.assessments.import','Import assessments'),
        ('training.assessments.export','Export assessments'),
        ('training.assessments.settings.view','View assessment settings'),
        ('training.assessments.settings.edit','Edit assessment settings')
      ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'TRAINING', permission_label
      where not exists (select 1 from public."Permission" where "tenantId" = tenant_id and "key" = permission_key);
    end loop;
  end loop;
end $$;
