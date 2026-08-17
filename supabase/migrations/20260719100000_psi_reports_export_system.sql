create table if not exists public.psi_report_templates (
  id text primary key default gen_random_uuid()::text,
  company_id text references public."Tenant"(id) on delete cascade,
  site_id text,
  template_number text,
  template_name text not null,
  template_type text not null,
  report_category text not null default 'Management',
  description text,
  scope_type text not null default 'Site',
  module_keys jsonb not null default '[]'::jsonb,
  section_config_json jsonb not null default '{}'::jsonb,
  evidence_config_json jsonb not null default '{}'::jsonb,
  output_config_json jsonb not null default '{}'::jsonb,
  include_documents boolean not null default false,
  include_redacted_content boolean not null default false,
  default_format text not null default 'PDF',
  active boolean not null default true,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_generated_reports (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  equipment_id text,
  template_id text references public.psi_report_templates(id) on delete set null,
  report_number text not null,
  report_name text not null,
  report_type text not null,
  report_category text not null default 'Management',
  scope_type text not null default 'Site',
  scope_json jsonb not null default '{}'::jsonb,
  sections_json jsonb not null default '[]'::jsonb,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  completeness_snapshot_json jsonb not null default '{}'::jsonb,
  approval_snapshot_json jsonb not null default '{}'::jsonb,
  document_snapshot_json jsonb not null default '{}'::jsonb,
  integration_snapshot_json jsonb not null default '{}'::jsonb,
  status text not null default 'Generated',
  format text not null default 'PDF',
  generated_with_warnings boolean not null default false,
  warnings_json jsonb not null default '[]'::jsonb,
  blockers_json jsonb not null default '[]'::jsonb,
  redaction_applied boolean not null default false,
  document_inclusion_status text not null default 'Metadata only',
  storage_key text,
  file_count integer not null default 0,
  package_id text,
  generated_by text,
  generated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_report_files (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  generated_report_id text references public.psi_generated_reports(id) on delete cascade,
  export_job_id text,
  package_id text,
  file_name text not null,
  file_type text not null,
  file_format text not null,
  storage_bucket text,
  storage_key text,
  size_bytes bigint not null default 0,
  checksum text,
  document_control_id text,
  classification text not null default 'Internal',
  redacted boolean not null default false,
  download_count integer not null default 0,
  last_downloaded_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_export_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  equipment_id text,
  export_number text not null,
  export_name text not null,
  export_type text not null,
  package_type text,
  scope_type text not null default 'Site',
  scope_json jsonb not null default '{}'::jsonb,
  module_keys jsonb not null default '[]'::jsonb,
  output_format text not null default 'ZIP',
  include_documents boolean not null default false,
  include_manifest boolean not null default true,
  include_history boolean not null default false,
  include_approvals boolean not null default true,
  redaction_mode text not null default 'Permission based',
  status text not null default 'Queued',
  progress_percent integer not null default 0,
  error_message text,
  warnings_json jsonb not null default '[]'::jsonb,
  requested_by text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text,
  package_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_export_packages (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  export_job_id text references public.psi_export_jobs(id) on delete set null,
  package_number text not null,
  package_name text not null,
  package_type text not null,
  scope_type text not null default 'Site',
  scope_json jsonb not null default '{}'::jsonb,
  manifest_json jsonb not null default '{}'::jsonb,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  document_snapshot_json jsonb not null default '{}'::jsonb,
  approval_snapshot_json jsonb not null default '{}'::jsonb,
  status text not null default 'Generated',
  storage_key text,
  file_count integer not null default 0,
  document_count integer not null default 0,
  warning_count integer not null default 0,
  generated_by text,
  generated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_export_package_items (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  package_id text not null references public.psi_export_packages(id) on delete cascade,
  item_type text not null,
  source_module text,
  source_record_id text,
  source_record_number text,
  title text not null,
  file_id text references public.psi_report_files(id) on delete set null,
  document_id text,
  document_number text,
  document_title text,
  document_status text,
  document_revision text,
  included boolean not null default true,
  excluded_reason text,
  redacted boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_scheduled_reports (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  schedule_name text not null,
  template_id text references public.psi_report_templates(id) on delete set null,
  report_type text not null,
  scope_type text not null default 'Site',
  scope_json jsonb not null default '{}'::jsonb,
  frequency text not null default 'Monthly',
  timezone text not null default 'UTC',
  next_run_at timestamptz,
  last_run_at timestamptz,
  recipient_user_ids jsonb not null default '[]'::jsonb,
  recipient_emails jsonb not null default '[]'::jsonb,
  output_format text not null default 'PDF',
  include_documents boolean not null default false,
  enabled boolean not null default true,
  status text not null default 'Active',
  failure_count integer not null default 0,
  last_error text,
  created_by text,
  updated_by text,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_report_download_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  generated_report_id text references public.psi_generated_reports(id) on delete set null,
  export_job_id text references public.psi_export_jobs(id) on delete set null,
  package_id text references public.psi_export_packages(id) on delete set null,
  file_id text references public.psi_report_files(id) on delete set null,
  download_type text not null,
  downloaded_by text,
  downloaded_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists public.psi_report_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  related_record_type text not null,
  related_record_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_values_json jsonb,
  after_values_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  actor_user_id text,
  audit_log_id text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_report_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  default_format text not null default 'PDF',
  default_redaction_mode text not null default 'Permission based',
  allow_document_exports boolean not null default true,
  require_approval_snapshot_for_official boolean not null default true,
  max_export_size_mb integer not null default 500,
  retention_days integer not null default 2555,
  schedule_timezone text not null default 'UTC',
  notification_settings_json jsonb not null default '{}'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_psi_report_templates_company_site on public.psi_report_templates(company_id, site_id);
create index if not exists idx_psi_report_templates_type on public.psi_report_templates(template_type, report_category) where archived_at is null;
create index if not exists idx_psi_generated_reports_scope on public.psi_generated_reports(company_id, site_id, unit_id, equipment_id);
create index if not exists idx_psi_generated_reports_status on public.psi_generated_reports(status, generated_at desc);
create index if not exists idx_psi_report_files_report on public.psi_report_files(generated_report_id, package_id, export_job_id);
create index if not exists idx_psi_export_jobs_scope_status on public.psi_export_jobs(company_id, site_id, status, requested_at desc);
create index if not exists idx_psi_export_packages_scope on public.psi_export_packages(company_id, site_id, package_type, generated_at desc);
create index if not exists idx_psi_export_package_items_package on public.psi_export_package_items(package_id, item_type);
create index if not exists idx_psi_scheduled_reports_next_run on public.psi_scheduled_reports(company_id, site_id, enabled, next_run_at);
create index if not exists idx_psi_report_download_events_file on public.psi_report_download_events(file_id, downloaded_at desc);
create index if not exists idx_psi_report_history_events_record on public.psi_report_history_events(related_record_type, related_record_id, created_at desc);
create index if not exists idx_psi_report_settings_scope on public.psi_report_settings(company_id, site_id);

alter table public.psi_report_templates enable row level security;
alter table public.psi_generated_reports enable row level security;
alter table public.psi_report_files enable row level security;
alter table public.psi_export_jobs enable row level security;
alter table public.psi_export_packages enable row level security;
alter table public.psi_export_package_items enable row level security;
alter table public.psi_scheduled_reports enable row level security;
alter table public.psi_report_download_events enable row level security;
alter table public.psi_report_history_events enable row level security;
alter table public.psi_report_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_report_templates',
    'psi_generated_reports',
    'psi_report_files',
    'psi_export_jobs',
    'psi_export_packages',
    'psi_export_package_items',
    'psi_scheduled_reports',
    'psi_report_download_events',
    'psi_report_history_events',
    'psi_report_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;

do $$
declare
  permission_record record;
  tenant_record record;
begin
  for permission_record in
    select *
    from (values
      ('psi.report.view', 'View PSI reports'),
      ('psi.report.dashboard.view', 'View PSI reports dashboard'),
      ('psi.report.generate', 'Generate PSI reports'),
      ('psi.report.generate.company', 'Generate company PSI reports'),
      ('psi.report.generate.site', 'Generate site PSI reports'),
      ('psi.report.generate.unit', 'Generate unit PSI reports'),
      ('psi.report.template.view', 'View PSI report templates'),
      ('psi.report.template.create', 'Create PSI report templates'),
      ('psi.report.template.edit', 'Edit PSI report templates'),
      ('psi.report.template.archive', 'Archive PSI report templates'),
      ('psi.report.download', 'Download PSI reports'),
      ('psi.report.archive', 'Archive PSI reports'),
      ('psi.report.regenerate', 'Regenerate PSI reports'),
      ('psi.export.view', 'View PSI exports'),
      ('psi.export.create', 'Create PSI exports'),
      ('psi.export.create_with_documents', 'Create PSI exports with documents'),
      ('psi.export.download', 'Download PSI exports'),
      ('psi.export.archive', 'Archive PSI exports'),
      ('psi.export.cancel', 'Cancel PSI exports'),
      ('psi.export.regenerate', 'Regenerate PSI exports'),
      ('psi.scheduled_report.view', 'View scheduled PSI reports'),
      ('psi.scheduled_report.create', 'Create scheduled PSI reports'),
      ('psi.scheduled_report.edit', 'Edit scheduled PSI reports'),
      ('psi.scheduled_report.archive', 'Archive scheduled PSI reports'),
      ('psi.report.settings.view', 'View PSI report settings'),
      ('psi.report.settings.edit', 'Edit PSI report settings')
    ) as p(permission_key, permission_label)
  loop
    for tenant_record in select id from public."Tenant" loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_record.permission_key, 'psi', permission_record.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_record.permission_key
      );
    end loop;
  end loop;
end $$;

insert into public.psi_report_settings (company_id, site_id)
select t.id, null
from public."Tenant" t
where not exists (
  select 1 from public.psi_report_settings s
  where s.company_id = t.id and s.site_id is null
);

insert into public.psi_report_templates (company_id, template_number, template_name, template_type, report_category, scope_type, module_keys, section_config_json, evidence_config_json, output_config_json, include_documents, default_format)
select t.id, 'PSI-TPL-' || lpad(row_number() over (partition by t.id order by v.template_name)::text, 4, '0'), v.template_name, v.template_type, v.report_category, v.scope_type, v.module_keys::jsonb, v.section_config_json::jsonb, v.evidence_config_json::jsonb, v.output_config_json::jsonb, v.include_documents, v.default_format
from public."Tenant" t
cross join (values
  ('PSI Executive Summary', 'PSI Executive Summary', 'Management', 'Site', '["dashboard","completeness","review-approval","integrations"]', '{"required":["Summary","PSI health","Critical gaps","Approvals","Integrations"]}', '{"includeLinkedDocuments":false}', '{"formats":["PDF","XLSX"]}', false, 'PDF'),
  ('Unit PSI Completeness Report', 'Unit PSI Completeness Report', 'Management', 'Unit', '["completeness","units","documents"]', '{"required":["Completeness matrix","Gap register","Document gaps","Blockers"]}', '{"includeLinkedDocuments":false}', '{"formats":["PDF","XLSX","CSV"]}', false, 'PDF'),
  ('Audit-Ready PSI Evidence Report', 'Audit-Ready PSI Evidence Report', 'Audit / Compliance', 'Site', '["completeness","review-approval","documents","history"]', '{"required":["Evidence register","Approval history","Waivers","History"]}', '{"includeLinkedDocuments":true,"includeManifest":true}', '{"formats":["ZIP","PDF + Excel"]}', true, 'ZIP'),
  ('PSSR Startup Readiness Evidence Package', 'PSSR Startup Readiness Evidence Package', 'Audit / Compliance', 'Unit', '["completeness","integrations","documents","review-approval"]', '{"required":["PSSR blockers","Required evidence","Approved documents","Sign-off evidence"]}', '{"includeLinkedDocuments":true,"includeManifest":true}', '{"formats":["ZIP with documents"]}', true, 'ZIP'),
  ('MOC PSI Impact Evidence Report', 'MOC PSI Impact Evidence Report', 'Audit / Compliance', 'Site', '["integrations","completeness","documents","history"]', '{"required":["MOC impacted records","Changed PSI","Open updates","Evidence"]}', '{"includeLinkedDocuments":true}', '{"formats":["PDF","XLSX","ZIP"]}', true, 'PDF'),
  ('Unit PSI Technical Package', 'Unit PSI Technical Package', 'Engineering', 'Unit', '["chemicals","process-chemistry","safe-operating-limits","equipment-design","relief-systems","drawings","electrical-classification","material-compatibility","safeguards"]', '{"required":["Chemicals","Process chemistry","SOL","Design basis","Relief","Drawings","Electrical","Materials","Safeguards"]}', '{"includeLinkedDocuments":true}', '{"formats":["PDF","ZIP with documents"]}', true, 'PDF'),
  ('Equipment PSI Technical Package', 'Equipment PSI Technical Package', 'Engineering', 'Equipment', '["equipment-design","relief-systems","drawings","electrical-classification","material-compatibility","safeguards","integrations"]', '{"required":["Design basis","Relief basis","Drawings","Electrical classification","Material compatibility","Safeguards","MI links"]}', '{"includeLinkedDocuments":true}', '{"formats":["PDF","ZIP with documents"]}', true, 'PDF'),
  ('Chemical Hazard / SDS Report', 'Chemical Hazard / SDS Report', 'Engineering', 'Site', '["chemicals","material-compatibility","documents"]', '{"required":["Chemical inventory","SDS status","Hazards","Incompatibilities"]}', '{"includeLinkedDocuments":true}', '{"formats":["PDF","XLSX","CSV"]}', true, 'PDF'),
  ('Current Approved Drawing Register', 'Current Approved Drawing Register', 'Module Specific', 'Site', '["drawings","documents"]', '{"required":["Current drawings","Redlines","Tag index","Approval status"]}', '{"includeLinkedDocuments":false}', '{"formats":["XLSX","CSV","PDF"]}', false, 'XLSX'),
  ('Critical Safeguard Report', 'Critical Safeguard Report', 'Module Specific', 'Site', '["safeguards","integrations","documents"]', '{"required":["Critical safeguards","Impairments","Testing status","LOPA/HAZOP basis"]}', '{"includeLinkedDocuments":true}', '{"formats":["PDF","XLSX"]}', true, 'PDF')
) as v(template_name, template_type, report_category, scope_type, module_keys, section_config_json, evidence_config_json, output_config_json, include_documents, default_format)
where not exists (
  select 1 from public.psi_report_templates existing
  where existing.company_id = t.id and existing.template_type = v.template_type
);

do $$
declare
  role_record record;
  permission_record record;
begin
  for role_record in
    select r.id, r."tenantId", lower(coalesce(r.name, r.key, '')) as role_name
    from public."Role" r
  loop
    for permission_record in
      select p.id, p.key
      from public."Permission" p
      where p."tenantId" = role_record."tenantId"
        and (p.key like 'psi.report.%' or p.key like 'psi.export.%' or p.key like 'psi.scheduled_report.%')
    loop
      if role_record.role_name like '%admin%' or role_record.role_name like '%process safety%' or role_record.role_name like '%psm%' then
        insert into public."RolePermission" ("roleId", "permissionId")
        select role_record.id, permission_record.id
        where not exists (
          select 1 from public."RolePermission" rp
          where rp."roleId" = role_record.id and rp."permissionId" = permission_record.id
        );
      end if;
    end loop;
  end loop;
end $$;
