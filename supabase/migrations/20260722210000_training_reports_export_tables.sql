create table if not exists public.training_report_templates (
  id text primary key,
  company_id text not null,
  site_id text,
  template_code text not null,
  template_name text not null,
  report_type text not null,
  source_module text not null,
  description text,
  default_format text not null default 'PDF',
  supported_formats_json jsonb not null default '["PDF","XLSX","CSV","JSON"]'::jsonb,
  default_filters_json jsonb not null default '{}'::jsonb,
  included_sections_json jsonb not null default '[]'::jsonb,
  included_columns_json jsonb not null default '[]'::jsonb,
  include_evidence_documents boolean not null default false,
  include_signatures boolean not null default false,
  include_audit_trail boolean not null default false,
  include_history boolean not null default false,
  confidentiality_level text not null default 'Internal',
  owner_user_id text,
  reviewer_user_id text,
  template_status text not null default 'Draft',
  version integer not null default 1,
  next_review_due date,
  system_template boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  unique(company_id, template_code, version)
);

create table if not exists public.training_generated_reports (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  report_code text,
  report_title text not null,
  report_type text not null,
  source_module text not null,
  source_record_id text,
  template_id text references public.training_report_templates(id),
  generated_by text,
  generated_at timestamptz not null default now(),
  report_status text not null default 'Generated',
  export_format text not null default 'PDF',
  filters_json jsonb not null default '{}'::jsonb,
  scope_json jsonb not null default '{}'::jsonb,
  summary_json jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  file_count integer not null default 0,
  confidentiality_level text not null default 'Internal',
  contains_worker_data boolean not null default false,
  contains_certificate_data boolean not null default false,
  contains_assessment_data boolean not null default false,
  contains_restricted_documents boolean not null default false,
  expires_at timestamptz,
  deleted_at timestamptz,
  deleted_by text,
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_report_files (
  id text primary key,
  company_id text not null,
  site_id text,
  generated_report_id text references public.training_generated_reports(id),
  export_job_id text,
  file_name text not null,
  file_type text not null default 'Report',
  file_format text not null,
  file_size_bytes bigint,
  storage_key text,
  document_id text,
  checksum text,
  confidentiality_level text not null default 'Internal',
  download_allowed boolean not null default true,
  expires_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_export_jobs (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  job_title text not null,
  report_type text not null,
  source_module text not null,
  source_record_id text,
  template_id text references public.training_report_templates(id),
  requested_by text,
  job_status text not null default 'Queued',
  export_format text not null default 'PDF',
  filters_json jsonb not null default '{}'::jsonb,
  scope_json jsonb not null default '{}'::jsonb,
  progress_percent integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  generated_report_id text references public.training_generated_reports(id),
  output_file_id text references public.training_report_files(id),
  warnings_count integer not null default 0,
  errors_count integer not null default 0,
  error_message text,
  retry_count integer not null default 0,
  result_summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_report_files
  drop constraint if exists training_report_files_export_job_id_fkey;
alter table public.training_report_files
  add constraint training_report_files_export_job_id_fkey foreign key (export_job_id) references public.training_export_jobs(id);

create table if not exists public.training_export_packages (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  package_code text,
  package_title text not null,
  package_type text not null,
  source_module text,
  source_record_id text,
  generated_report_id text references public.training_generated_reports(id),
  export_job_id text references public.training_export_jobs(id),
  generated_by text,
  generated_at timestamptz not null default now(),
  package_status text not null default 'Generated',
  manifest_json jsonb not null default '{}'::jsonb,
  file_count integer not null default 0,
  included_document_count integer not null default 0,
  excluded_document_count integer not null default 0,
  confidentiality_level text not null default 'Internal',
  storage_key text,
  document_id text,
  package_size_bytes bigint,
  checksum text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_export_package_items (
  id text primary key,
  company_id text not null,
  site_id text,
  package_id text not null references public.training_export_packages(id),
  item_type text not null,
  source_module text not null,
  source_record_id text,
  document_id text,
  file_id text,
  item_title text,
  included boolean not null default true,
  excluded_reason text,
  confidentiality_level text,
  checksum text,
  added_at timestamptz not null default now()
);

create table if not exists public.training_scheduled_reports (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  schedule_title text not null,
  template_id text not null references public.training_report_templates(id),
  report_type text not null,
  source_module text not null,
  scope_json jsonb not null default '{}'::jsonb,
  filters_json jsonb not null default '{}'::jsonb,
  export_format text not null default 'PDF',
  delivery_method text not null default 'Download',
  recipients_json jsonb not null default '[]'::jsonb,
  frequency text not null default 'Monthly',
  schedule_rule_json jsonb not null default '{}'::jsonb,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_job_id text references public.training_export_jobs(id),
  status text not null default 'Active',
  owner_user_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text
);

create table if not exists public.training_report_download_events (
  id text primary key,
  company_id text not null,
  site_id text,
  generated_report_id text references public.training_generated_reports(id),
  report_file_id text references public.training_report_files(id),
  package_id text references public.training_export_packages(id),
  downloaded_by text,
  downloaded_at timestamptz not null default now(),
  download_method text,
  ip_address text,
  user_agent text,
  allowed boolean not null default true,
  denied_reason text,
  confidentiality_level text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_report_history_events (
  id text primary key,
  company_id text not null,
  site_id text,
  unit_id text,
  area_id text,
  generated_report_id text,
  template_id text,
  export_job_id text,
  package_id text,
  scheduled_report_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'Training Reports',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_report_settings (
  id text primary key,
  company_id text not null,
  site_id text,
  default_export_format text not null default 'PDF',
  default_confidentiality_level text not null default 'Internal',
  default_report_expiry_days integer not null default 30,
  allow_pdf_export boolean not null default true,
  allow_xlsx_export boolean not null default true,
  allow_csv_export boolean not null default true,
  allow_json_export boolean not null default true,
  allow_zip_evidence_packages boolean not null default true,
  require_audit_event_on_download boolean not null default true,
  require_manifest_for_evidence_packages boolean not null default true,
  include_company_logo_by_default boolean not null default true,
  include_filters_summary_by_default boolean not null default true,
  include_generated_by_by_default boolean not null default true,
  include_data_timestamp_by_default boolean not null default true,
  exclude_assessment_answers_by_default boolean not null default true,
  exclude_personal_contact_data_by_default boolean not null default true,
  require_approval_for_restricted_exports boolean not null default false,
  allow_scheduled_reports boolean not null default true,
  max_rows_sync_export integer,
  max_package_size_mb integer,
  settings_json jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists training_report_templates_company_site_idx on public.training_report_templates(company_id, site_id, template_status);
create index if not exists training_report_templates_type_module_idx on public.training_report_templates(report_type, source_module);
create index if not exists training_generated_reports_company_site_type_idx on public.training_generated_reports(company_id, site_id, report_type);
create index if not exists training_generated_reports_generated_by_idx on public.training_generated_reports(generated_by, generated_at desc);
create index if not exists training_report_files_generated_report_idx on public.training_report_files(generated_report_id);
create index if not exists training_export_jobs_company_site_status_idx on public.training_export_jobs(company_id, site_id, job_status);
create index if not exists training_export_jobs_requested_by_idx on public.training_export_jobs(requested_by, created_at desc);
create index if not exists training_export_packages_company_site_type_idx on public.training_export_packages(company_id, site_id, package_type);
create index if not exists training_export_package_items_package_idx on public.training_export_package_items(package_id, source_module);
create index if not exists training_scheduled_reports_company_site_status_idx on public.training_scheduled_reports(company_id, site_id, status);
create index if not exists training_report_download_events_user_idx on public.training_report_download_events(downloaded_by, downloaded_at desc);
create index if not exists training_report_history_generated_idx on public.training_report_history_events(generated_report_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_report_templates',
    'training_generated_reports',
    'training_report_files',
    'training_export_jobs',
    'training_export_packages',
    'training_export_package_items',
    'training_scheduled_reports',
    'training_report_download_events',
    'training_report_history_events',
    'training_report_settings'
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
  end loop;
end $$;

do $$
declare
  permission_key text;
  permission_label text;
  permission_item text[];
  tenant_row record;
  permissions text[][] := array[
    array['training.reports.view','View training reports'],
    array['training.reports.dashboard.view','View training reports dashboard'],
    array['training.reports.template.view','View training report templates'],
    array['training.reports.template.create','Create training report templates'],
    array['training.reports.template.edit','Edit training report templates'],
    array['training.reports.template.archive','Archive training report templates'],
    array['training.reports.template.activate','Activate training report templates'],
    array['training.reports.generate','Generate training reports'],
    array['training.reports.generate.company','Generate company training reports'],
    array['training.reports.generate.site','Generate site training reports'],
    array['training.reports.export.pdf','Export training reports as PDF'],
    array['training.reports.export.xlsx','Export training reports as XLSX'],
    array['training.reports.export.csv','Export training reports as CSV'],
    array['training.reports.export.json','Export training reports as JSON'],
    array['training.reports.export.zip','Export training evidence ZIP packages'],
    array['training.reports.download','Download training reports'],
    array['training.reports.download.restricted','Download restricted training reports'],
    array['training.reports.package.view','View training evidence packages'],
    array['training.reports.package.create','Create training evidence packages'],
    array['training.reports.package.download','Download training evidence packages'],
    array['training.reports.scheduled.view','View scheduled training reports'],
    array['training.reports.scheduled.create','Create scheduled training reports'],
    array['training.reports.scheduled.edit','Edit scheduled training reports'],
    array['training.reports.scheduled.archive','Archive scheduled training reports'],
    array['training.reports.audit_evidence.view','View training audit evidence'],
    array['training.reports.audit_evidence.export','Export training audit evidence'],
    array['training.reports.worker_evidence.export','Export worker evidence package'],
    array['training.reports.moc_evidence.export','Export MOC training evidence'],
    array['training.reports.pssr_evidence.export','Export PSSR training evidence'],
    array['training.reports.ptw_evidence.export','Export PTW authorization evidence'],
    array['training.reports.history.view','View training report history'],
    array['training.reports.settings.view','View training report settings'],
    array['training.reports.settings.edit','Edit training report settings']
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
  join public."Permission" p on p."tenantId" = r."tenantId" and p."key" like 'training.reports.%'
  where lower(coalesce(r.name, '')) in ('admin','administrator','company admin','super admin','owner')
    and not exists (
      select 1 from public."RolePermission" rp
      where rp."roleId" = r.id and rp."permissionId" = p.id
    );
end $$;
