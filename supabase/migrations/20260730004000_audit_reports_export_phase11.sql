create table if not exists public.audit_report_templates (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  template_code text,
  template_name text not null,
  template_type text not null default 'Audit Report',
  template_status text not null default 'Draft',
  intended_audience text,
  default_format text not null default 'PDF',
  supported_formats jsonb not null default '["PDF"]'::jsonb,
  section_schema_json jsonb not null default '{}'::jsonb,
  evidence_rules_json jsonb not null default '{}'::jsonb,
  redaction_rules_json jsonb not null default '{}'::jsonb,
  approval_required boolean not null default false,
  version_number integer not null default 1,
  approved_by text,
  approved_at timestamptz,
  archived_by text,
  archived_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, template_code)
);

create table if not exists public.audit_reports (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  program_id text,
  plan_id text,
  execution_id text,
  finding_id text,
  capa_id text,
  evidence_package_id text,
  scoring_run_id text,
  standards_mapping_id text,
  approval_id text,
  template_id text references public.audit_report_templates(id) on delete set null,
  report_code text not null,
  report_title text not null,
  report_description text,
  report_type text not null,
  report_status text not null default 'Draft',
  readiness_status text not null default 'Not Ready',
  stale_status text not null default 'Current',
  stale_reason text,
  source_module text,
  source_record_type text,
  source_record_id text,
  source_record_number text,
  source_record_title text,
  source_record_status text,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  source_snapshot_hash text,
  report_manifest_json jsonb not null default '{}'::jsonb,
  included_sections_json jsonb not null default '[]'::jsonb,
  included_formats_json jsonb not null default '[]'::jsonb,
  intended_audience text,
  confidentiality_level text not null default 'Internal',
  restricted boolean not null default false,
  restricted_reason text,
  redaction_required boolean not null default false,
  approval_required boolean not null default false,
  approved_snapshot_required boolean not null default false,
  official_report boolean not null default false,
  locked boolean not null default false,
  locked_by text,
  locked_at timestamptz,
  generated_by text,
  generated_at timestamptz,
  submitted_for_approval_by text,
  submitted_for_approval_at timestamptz,
  marked_historical_by text,
  marked_historical_at timestamptz,
  archived_by text,
  archived_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, report_code)
);

create table if not exists public.audit_report_generation_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text references public.audit_reports(id) on delete cascade,
  job_type text not null default 'Generate',
  job_status text not null default 'Queued',
  requested_format text,
  requested_formats_json jsonb not null default '[]'::jsonb,
  requested_by text,
  progress_percent integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  error_message text,
  job_payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_report_sections (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text not null references public.audit_reports(id) on delete cascade,
  section_key text not null,
  section_title text not null,
  section_order integer not null default 0,
  included boolean not null default true,
  required boolean not null default false,
  readiness_status text not null default 'Not Checked',
  source_module text,
  source_record_id text,
  content_snapshot_json jsonb not null default '{}'::jsonb,
  redacted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(report_id, section_key)
);

create table if not exists public.audit_report_source_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text not null references public.audit_reports(id) on delete cascade,
  linked_module text not null,
  linked_record_type text,
  linked_record_id text not null,
  linked_record_number text,
  linked_record_title text,
  linked_record_status text,
  snapshot_json jsonb not null default '{}'::jsonb,
  snapshot_hash text,
  stale_status text not null default 'Current',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_report_evidence_items (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text not null references public.audit_reports(id) on delete cascade,
  evidence_id text,
  evidence_code text,
  evidence_title text,
  evidence_type text,
  evidence_status text,
  confidentiality_level text,
  restricted boolean not null default false,
  include_in_report boolean not null default true,
  include_in_package boolean not null default true,
  redacted boolean not null default false,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_report_files (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text not null references public.audit_reports(id) on delete cascade,
  job_id text references public.audit_report_generation_jobs(id) on delete set null,
  file_name text not null,
  file_format text not null,
  file_status text not null default 'Generated',
  storage_bucket text,
  storage_path text,
  storage_object_id text,
  file_size_bytes bigint,
  checksum text,
  version_number integer not null default 1,
  official boolean not null default false,
  published_document_id text,
  published_document_number text,
  published_document_title text,
  published_document_revision text,
  published_document_status text,
  created_by text,
  created_at timestamptz not null default now(),
  archived_by text,
  archived_at timestamptz
);

create table if not exists public.audit_report_versions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text not null references public.audit_reports(id) on delete cascade,
  version_number integer not null,
  version_status text not null default 'Draft',
  version_reason text,
  report_snapshot_json jsonb not null default '{}'::jsonb,
  manifest_hash text,
  created_by text,
  created_at timestamptz not null default now(),
  locked boolean not null default false,
  locked_at timestamptz,
  superseded_by_version_id text
);

create table if not exists public.audit_report_access_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text references public.audit_reports(id) on delete set null,
  file_id text references public.audit_report_files(id) on delete set null,
  access_type text not null,
  access_status text not null default 'Allowed',
  actor_user_id text,
  reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  accessed_at timestamptz not null default now()
);

create table if not exists public.audit_report_download_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text references public.audit_reports(id) on delete set null,
  file_id text references public.audit_report_files(id) on delete set null,
  download_format text,
  download_status text not null default 'Logged',
  actor_user_id text,
  secure_url_issued boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  downloaded_at timestamptz not null default now()
);

create table if not exists public.audit_report_package_foundations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  package_code text not null,
  package_title text not null,
  package_type text not null default 'Audit Report Package',
  package_status text not null default 'Draft',
  manifest_json jsonb not null default '{}'::jsonb,
  requested_by text,
  prepared_by text,
  prepared_at timestamptz,
  exported_by text,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, package_code)
);

create table if not exists public.audit_report_package_items (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  package_id text not null references public.audit_report_package_foundations(id) on delete cascade,
  report_id text references public.audit_reports(id) on delete cascade,
  evidence_id text,
  file_id text references public.audit_report_files(id) on delete set null,
  item_type text not null,
  item_title text,
  item_order integer not null default 0,
  restricted boolean not null default false,
  redacted boolean not null default false,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_report_approval_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text not null references public.audit_reports(id) on delete cascade,
  approval_id text,
  approval_status text,
  approval_snapshot_json jsonb not null default '{}'::jsonb,
  linked_at timestamptz not null default now()
);

create table if not exists public.audit_report_staleness_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text not null references public.audit_reports(id) on delete cascade,
  source_module text,
  source_record_id text,
  stale_reason text not null,
  previous_hash text,
  current_hash text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create table if not exists public.audit_report_validation_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text references public.audit_reports(id) on delete cascade,
  check_key text not null,
  check_title text not null,
  check_status text not null default 'Not Run',
  severity text not null default 'Info',
  message text,
  related_section_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_report_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  report_id text references public.audit_reports(id) on delete set null,
  template_id text references public.audit_report_templates(id) on delete set null,
  package_id text references public.audit_report_package_foundations(id) on delete set null,
  job_id text references public.audit_report_generation_jobs(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'Audit Reports / Export',
  source_record_id text,
  audit_log_id text,
  correlation_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_report_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  allow_pdf_export boolean not null default true,
  allow_docx_export boolean not null default true,
  allow_xlsx_export boolean not null default true,
  allow_csv_export boolean not null default true,
  allow_zip_packages boolean not null default true,
  require_approval_for_official boolean not null default true,
  require_audit_event_on_preview boolean not null default true,
  require_audit_event_on_download boolean not null default true,
  block_current_if_stale boolean not null default true,
  default_confidentiality_level text not null default 'Internal',
  settings_json jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists audit_reports_company_site_status_idx on public.audit_reports(company_id, site_id, report_status);
create index if not exists audit_reports_report_code_idx on public.audit_reports(report_code);
create index if not exists audit_reports_source_idx on public.audit_reports(source_module, source_record_id);
create index if not exists audit_reports_program_idx on public.audit_reports(program_id);
create index if not exists audit_reports_plan_idx on public.audit_reports(plan_id);
create index if not exists audit_reports_execution_idx on public.audit_reports(execution_id);
create index if not exists audit_reports_template_idx on public.audit_reports(template_id);
create index if not exists audit_reports_generated_idx on public.audit_reports(generated_at);
create index if not exists audit_report_generation_jobs_company_site_status_idx on public.audit_report_generation_jobs(company_id, site_id, job_status);
create index if not exists audit_report_sections_report_order_idx on public.audit_report_sections(report_id, section_order);
create index if not exists audit_report_source_links_record_idx on public.audit_report_source_links(report_id, linked_module, linked_record_id);
create index if not exists audit_report_evidence_items_report_idx on public.audit_report_evidence_items(report_id, evidence_id);
create index if not exists audit_report_files_status_idx on public.audit_report_files(report_id, file_status);
create index if not exists audit_report_access_events_report_idx on public.audit_report_access_events(report_id, accessed_at);
create index if not exists audit_report_download_events_report_idx on public.audit_report_download_events(report_id, downloaded_at);
create index if not exists audit_report_package_items_package_idx on public.audit_report_package_items(package_id);
create index if not exists audit_report_history_events_report_idx on public.audit_report_history_events(report_id, created_at);
create unique index if not exists audit_report_settings_company_site_uidx on public.audit_report_settings(company_id, coalesce(site_id, ''));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'audit_report_templates',
    'audit_reports',
    'audit_report_generation_jobs',
    'audit_report_sections',
    'audit_report_source_links',
    'audit_report_evidence_items',
    'audit_report_files',
    'audit_report_versions',
    'audit_report_access_events',
    'audit_report_download_events',
    'audit_report_package_foundations',
    'audit_report_package_items',
    'audit_report_approval_links',
    'audit_report_staleness_events',
    'audit_report_validation_results',
    'audit_report_history_events',
    'audit_report_settings'
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
    array['audit.report.view','View audit reports and exports'],
    array['audit.report.dashboard.view','View audit reports dashboard'],
    array['audit.report.register.view','View audit report register'],
    array['audit.report.create','Create audit reports'],
    array['audit.report.generate','Generate audit reports'],
    array['audit.report.regenerate','Regenerate audit reports'],
    array['audit.report.preview','Preview audit reports'],
    array['audit.report.download','Download audit reports'],
    array['audit.report.export','Export audit reports'],
    array['audit.report.archive','Archive audit reports'],
    array['audit.report.lock','Lock audit reports'],
    array['audit.report.unlock','Unlock audit reports'],
    array['audit.report.mark_historical','Mark audit reports historical'],
    array['audit.report.template.view','View audit report templates'],
    array['audit.report.template.create','Create audit report templates'],
    array['audit.report.template.edit','Edit audit report templates'],
    array['audit.report.template.approve','Approve audit report templates'],
    array['audit.report.template.archive','Archive audit report templates'],
    array['audit.report.package.view','View audit report packages'],
    array['audit.report.package.prepare','Prepare audit report packages'],
    array['audit.report.package.export','Export audit report packages'],
    array['audit.report.restricted.view','View restricted audit reports'],
    array['audit.report.restricted.export','Export restricted audit report data'],
    array['audit.report.access_log.view','View audit report access logs'],
    array['audit.report.download_log.view','View audit report download logs'],
    array['audit.report.approval.submit','Submit audit reports for approval'],
    array['audit.report.approval.view','View audit report approval links'],
    array['audit.report.validation.run','Run audit report validation'],
    array['audit.report.history.view','View audit report history'],
    array['audit.report.settings.view','View audit report settings'],
    array['audit.report.settings.edit','Edit audit report settings']
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
