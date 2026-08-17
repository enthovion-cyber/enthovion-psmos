-- Training & Competency Phase 4 - Required Training Library.

create table if not exists public.training_required_items (
  id text primary key,
  company_id text not null,
  site_id text null,
  training_code text not null,
  training_title text not null,
  training_category text not null default 'Other',
  training_type text not null default 'Awareness',
  description text null,
  objective text null,
  target_audience text null,
  owner_user_id text null,
  owner_role text null,
  reviewer_user_id text null,
  version text not null default '1.0',
  version_number integer not null default 1,
  effective_date date null,
  next_review_date date null,
  status text not null default 'Draft',
  review_status text not null default 'Draft',
  criticality text not null default 'Standard',
  safety_critical boolean not null default false,
  psm_critical boolean not null default false,
  ptw_critical boolean not null default false,
  moc_critical boolean not null default false,
  pssr_critical boolean not null default false,
  recurrence_type text not null default 'One-Time',
  recurrence_interval_days integer null,
  delivery_method text null,
  evidence_policy_status text not null default 'Missing Evidence Policy',
  document_status text not null default 'No Document Required',
  matrix_sync_status text not null default 'Not Linked',
  competency_sync_status text not null default 'Not Linked',
  usage_count integer not null default 0,
  readiness_status text not null default 'Warning',
  readiness_blockers_json jsonb not null default '[]'::jsonb,
  notes text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by text null,
  updated_by text null,
  approved_by text null,
  approved_at timestamptz null,
  archived_by text null,
  archived_at timestamptz null,
  archive_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_required_items_code_scope_uniq unique(company_id, site_id, training_code)
);

create table if not exists public.training_required_item_scopes (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  scope_type text not null default 'Site',
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
  sop_id text null,
  psi_module text null,
  psi_record_id text null,
  moc_trigger_type text null,
  pssr_trigger_type text null,
  applicability_rule_json jsonb not null default '{}'::jsonb,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_required_item_content_sections (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  section_order integer not null default 1,
  section_title text not null,
  summary text null,
  learning_outcome text null,
  linked_sop_id text null,
  linked_psi_module text null,
  linked_hazard text null,
  required boolean not null default true,
  duration_minutes integer null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_required_item_delivery_rules (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  delivery_method text null,
  instructor_required boolean not null default false,
  self_paced_allowed boolean not null default false,
  external_provider_allowed boolean not null default false,
  initial_due_rule text null,
  required_before_site_access boolean not null default false,
  required_before_unit_access boolean not null default false,
  required_before_ptw_role boolean not null default false,
  required_before_moc_implementation boolean not null default false,
  required_before_pssr_startup boolean not null default false,
  one_time boolean not null default true,
  recurring boolean not null default false,
  recurrence_interval_days integer null,
  grace_period_days integer null,
  expiry_warning_days integer null,
  requalification_after_incident boolean not null default false,
  requalification_after_sop_change boolean not null default false,
  requalification_after_psi_change boolean not null default false,
  requalification_after_moc boolean not null default false,
  notes text null,
  updated_by text null,
  updated_at timestamptz not null default now()
);

create table if not exists public.training_required_item_evidence_rules (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  evidence_required boolean not null default true,
  accepted_evidence_types text[] not null default '{}'::text[],
  primary_evidence_type text null,
  attendance_required boolean not null default false,
  certificate_required boolean not null default false,
  assessment_required boolean not null default false,
  minimum_score numeric null,
  sop_acknowledgement_required boolean not null default false,
  practical_demonstration_required boolean not null default false,
  supervisor_signoff_required boolean not null default false,
  hse_verification_required boolean not null default false,
  external_certificate_allowed boolean not null default false,
  document_evidence_required boolean not null default false,
  verification_required boolean not null default false,
  verification_role text null,
  approval_required boolean not null default false,
  e_signature_required boolean not null default false,
  evidence_validity_days integer null,
  retake_required_on_fail boolean not null default false,
  max_attempts integer null,
  notes text null,
  updated_by text null,
  updated_at timestamptz not null default now()
);

create table if not exists public.training_required_item_links (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  link_type text not null,
  linked_module text not null,
  linked_record_id text null,
  linked_record_number text null,
  linked_record_title text null,
  link_reason text null,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_required_item_documents (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  document_id text null,
  document_number text null,
  document_title text not null,
  document_type text null,
  document_status text not null default 'Linked',
  revision text null,
  controlled boolean not null default true,
  required_document boolean not null default false,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_required_item_matrix_links (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  matrix_rule_id text null references public.training_matrix_rules(id) on delete set null,
  matrix_rule_code text null,
  matrix_rule_title text null,
  link_status text not null default 'Linked',
  sync_status text not null default 'Sync Required',
  impact_json jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_required_item_competency_links (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  competency_profile_id text null references public.training_competency_profiles(id) on delete set null,
  competency_requirement_id text null references public.training_competency_requirements(id) on delete set null,
  competency_code text null,
  competency_title text null,
  link_status text not null default 'Linked',
  sync_status text not null default 'Sync Required',
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_required_item_versions (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  version text not null,
  version_number integer not null,
  version_type text not null default 'Minor edit',
  change_reason text not null,
  snapshot_json jsonb not null default '{}'::jsonb,
  superseded_by_version_id text null,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_required_item_review_records (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text not null references public.training_required_items(id) on delete cascade,
  review_type text not null default 'Approval',
  review_status text not null default 'Pending Review',
  reviewer_user_id text null,
  requested_by text null,
  requested_at timestamptz not null default now(),
  decision_by text null,
  decision_at timestamptz null,
  decision_reason text null,
  comments text null,
  snapshot_json jsonb not null default '{}'::jsonb
);

create table if not exists public.training_required_item_import_jobs (
  id text primary key,
  company_id text not null,
  site_id text null,
  import_status text not null default 'Queued',
  source_file_name text null,
  total_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  error_count integer not null default 0,
  error_json jsonb not null default '[]'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table if not exists public.training_required_item_history_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  required_training_id text null references public.training_required_items(id) on delete set null,
  event_number integer null,
  event_type text not null,
  event_category text not null default 'Required Training',
  event_title text not null,
  event_description text null,
  related_record_type text null,
  related_record_id text null,
  actor_user_id text null,
  reason text null,
  before_values_json jsonb null,
  after_values_json jsonb null,
  metadata_json jsonb not null default '{}'::jsonb,
  audit_log_id text null,
  correlation_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_required_item_settings (
  id text primary key,
  company_id text not null,
  site_id text null,
  owner_required boolean not null default true,
  reviewer_required boolean not null default false,
  evidence_policy_required boolean not null default true,
  approved_document_required_for_safety_critical boolean not null default true,
  matrix_link_required_for_active boolean not null default false,
  competency_link_required_for_safety_critical boolean not null default false,
  review_interval_days integer not null default 365,
  controlled_edit_requires_new_version boolean not null default true,
  import_requires_review boolean not null default true,
  settings_json jsonb not null default '{}'::jsonb,
  updated_by text null,
  updated_at timestamptz not null default now(),
  constraint training_required_item_settings_scope_uniq unique(company_id, site_id)
);

create index if not exists training_required_items_company_site_status_idx on public.training_required_items(company_id, site_id, status);
create index if not exists training_required_items_code_idx on public.training_required_items(company_id, training_code);
create index if not exists training_required_items_category_idx on public.training_required_items(training_category);
create index if not exists training_required_items_review_idx on public.training_required_items(company_id, site_id, review_status, next_review_date);
create index if not exists training_required_items_critical_idx on public.training_required_items(company_id, safety_critical, psm_critical, ptw_critical);
create index if not exists training_required_scopes_item_idx on public.training_required_item_scopes(required_training_id);
create index if not exists training_required_content_item_idx on public.training_required_item_content_sections(required_training_id, section_order);
create index if not exists training_required_links_item_idx on public.training_required_item_links(required_training_id, linked_module);
create index if not exists training_required_documents_item_idx on public.training_required_item_documents(required_training_id);
create index if not exists training_required_matrix_links_item_idx on public.training_required_item_matrix_links(required_training_id);
create index if not exists training_required_competency_links_item_idx on public.training_required_item_competency_links(required_training_id);
create index if not exists training_required_versions_item_idx on public.training_required_item_versions(required_training_id, version_number desc);
create index if not exists training_required_history_item_idx on public.training_required_item_history_events(required_training_id, created_at desc);

alter table public.training_required_items enable row level security;
alter table public.training_required_item_scopes enable row level security;
alter table public.training_required_item_content_sections enable row level security;
alter table public.training_required_item_delivery_rules enable row level security;
alter table public.training_required_item_evidence_rules enable row level security;
alter table public.training_required_item_links enable row level security;
alter table public.training_required_item_documents enable row level security;
alter table public.training_required_item_matrix_links enable row level security;
alter table public.training_required_item_competency_links enable row level security;
alter table public.training_required_item_versions enable row level security;
alter table public.training_required_item_review_records enable row level security;
alter table public.training_required_item_import_jobs enable row level security;
alter table public.training_required_item_history_events enable row level security;
alter table public.training_required_item_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_required_items',
    'training_required_item_scopes',
    'training_required_item_content_sections',
    'training_required_item_delivery_rules',
    'training_required_item_evidence_rules',
    'training_required_item_links',
    'training_required_item_documents',
    'training_required_item_matrix_links',
    'training_required_item_competency_links',
    'training_required_item_versions',
    'training_required_item_review_records',
    'training_required_item_import_jobs',
    'training_required_item_history_events',
    'training_required_item_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_policy', table_name);
    execute format(
      'create policy %I on public.%I using (company_id = coalesce(auth.jwt() ->> %L, auth.jwt() ->> %L, %L)) with check (company_id = coalesce(auth.jwt() ->> %L, auth.jwt() ->> %L, %L))',
      table_name || '_tenant_policy',
      table_name,
      'tenantId',
      'tenant_id',
      '',
      'tenantId',
      'tenant_id',
      ''
    );
  end loop;
end $$;

grant select, insert, update, delete on public.training_required_items to authenticated;
grant select, insert, update, delete on public.training_required_item_scopes to authenticated;
grant select, insert, update, delete on public.training_required_item_content_sections to authenticated;
grant select, insert, update on public.training_required_item_delivery_rules to authenticated;
grant select, insert, update on public.training_required_item_evidence_rules to authenticated;
grant select, insert, delete on public.training_required_item_links to authenticated;
grant select, insert, delete on public.training_required_item_documents to authenticated;
grant select, insert, update, delete on public.training_required_item_matrix_links to authenticated;
grant select, insert, update, delete on public.training_required_item_competency_links to authenticated;
grant select, insert on public.training_required_item_versions to authenticated;
grant select, insert, update on public.training_required_item_review_records to authenticated;
grant select, insert, update on public.training_required_item_import_jobs to authenticated;
grant select, insert on public.training_required_item_history_events to authenticated;
grant select, insert, update on public.training_required_item_settings to authenticated;

do $$
declare
  tenant_row record;
  permission_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_row in
      select * from (values
        ('training.required.view', 'View Required Training'),
        ('training.required.dashboard.view', 'View Required Training dashboard'),
        ('training.required.library.view', 'View Required Training library'),
        ('training.required.library.create', 'Create Required Training items'),
        ('training.required.library.edit', 'Edit Required Training items'),
        ('training.required.library.archive', 'Archive Required Training items'),
        ('training.required.library.reactivate', 'Reactivate Required Training items'),
        ('training.required.library.activate', 'Activate Required Training items'),
        ('training.required.library.new_version', 'Create Required Training new version'),
        ('training.required.content.manage', 'Manage Required Training content'),
        ('training.required.delivery.manage', 'Manage Required Training delivery rules'),
        ('training.required.evidence.manage', 'Manage Required Training evidence rules'),
        ('training.required.scope.manage', 'Manage Required Training scope'),
        ('training.required.link.manage', 'Manage Required Training links'),
        ('training.required.document.link', 'Link Required Training documents'),
        ('training.required.document.remove', 'Remove Required Training documents'),
        ('training.required.matrix.link', 'Link Required Training to matrix'),
        ('training.required.matrix.sync', 'Sync Required Training to matrix'),
        ('training.required.competency.link', 'Link Required Training to competency profiles'),
        ('training.required.submit_review', 'Submit Required Training for review'),
        ('training.required.approve', 'Approve Required Training'),
        ('training.required.import', 'Import Required Training library'),
        ('training.required.export', 'Export Required Training library'),
        ('training.required.history.view', 'View Required Training history'),
        ('training.required.settings.view', 'View Required Training settings'),
        ('training.required.settings.edit', 'Edit Required Training settings')
      ) as p(key, label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_row.key, 'training', permission_row.label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_row.key
      );
    end loop;
  end loop;
end $$;
