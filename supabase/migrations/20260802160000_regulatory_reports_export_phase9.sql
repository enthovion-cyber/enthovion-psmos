create table if not exists public.regulatory_report_templates (
  id text primary key,
  company_id text not null,
  site_id text null,
  template_code text null,
  template_title text not null,
  report_type text not null,
  default_sections_json jsonb null,
  default_evidence_rules_json jsonb null,
  default_export_format text null,
  default_audience text null,
  header_footer_foundation_json jsonb null,
  watermark_foundation text null,
  confidentiality_footer_foundation text null,
  template_status text not null default 'Draft',
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_reports (
  id text primary key,
  company_id text not null,
  site_id text null,
  department_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  report_code text null,
  report_title text not null,
  report_type text not null,
  report_purpose text null,
  audience text not null,
  confidentiality_level text not null,
  report_status text not null default 'Draft',
  readiness_status text not null default 'Not Ready',
  stale_status text not null default 'Current',
  stale_reason text null,
  export_format text not null,
  current_version integer not null default 1,
  template_id text null references public.regulatory_report_templates(id) on delete set null,
  template_snapshot_json jsonb null,
  source_scope_json jsonb null,
  source_filters_json jsonb null,
  source_snapshot_json jsonb null,
  generation_manifest_json jsonb null,
  evidence_rules_json jsonb null,
  section_config_json jsonb null,
  included_source_count integer not null default 0,
  included_evidence_count integer not null default 0,
  restricted_evidence_count integer not null default 0,
  excluded_evidence_count integer not null default 0,
  open_gap_count integer not null default 0,
  open_action_count integer not null default 0,
  approval_required boolean not null default false,
  approval_package_id text null,
  approval_status text null,
  locked boolean not null default false,
  locked_by text null,
  locked_at timestamptz null,
  lock_reason text null,
  generated_by text null,
  generated_at timestamptz null,
  approved_by text null,
  approved_at timestamptz null,
  owner_user_id text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_report_source_links (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text not null references public.regulatory_reports(id) on delete cascade,
  source_type text not null,
  source_record_id text not null,
  regulatory_item_id text null,
  obligation_id text null,
  compliance_assessment_id text null,
  compliance_gap_id text null,
  evidence_link_id text null,
  audit_mapping_id text null,
  action_link_id text null,
  review_package_id text null,
  source_snapshot_json jsonb null,
  included boolean not null default true,
  excluded_reason text null,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_report_sections (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text not null references public.regulatory_reports(id) on delete cascade,
  section_key text not null,
  section_title text not null,
  section_order integer not null default 0,
  included boolean not null default true,
  section_status text not null default 'Pending',
  section_data_snapshot_json jsonb null,
  generated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_report_evidence_items (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text not null references public.regulatory_reports(id) on delete cascade,
  evidence_link_id text null,
  evidence_requirement_id text null,
  regulatory_item_id text null,
  obligation_id text null,
  included boolean not null default true,
  restricted boolean not null default false,
  stale boolean not null default false,
  evidence_status text null,
  included_reason text null,
  excluded_reason text null,
  source_snapshot_json jsonb null,
  added_by text null,
  added_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_report_files (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text not null references public.regulatory_reports(id) on delete cascade,
  report_version_id text null,
  file_code text null,
  file_name text not null,
  file_type text not null,
  export_format text not null,
  file_status text not null default 'Generated',
  storage_file_id text null,
  document_id text null,
  file_size_bytes bigint null,
  file_hash text null,
  generated_by text null,
  generated_at timestamptz null,
  created_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_report_versions (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text not null references public.regulatory_reports(id) on delete cascade,
  version_number integer not null,
  version_status text not null default 'Current',
  source_snapshot_json jsonb not null default '{}'::jsonb,
  generation_manifest_json jsonb not null default '{}'::jsonb,
  generated_by text null,
  generated_at timestamptz not null default now(),
  superseded_by_version_id text null,
  superseded_at timestamptz null,
  version_reason text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_report_generation_jobs (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text null references public.regulatory_reports(id) on delete set null,
  job_code text null,
  job_type text not null,
  job_status text not null default 'Queued',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  export_format text not null,
  source_payload_json jsonb null,
  validation_result_json jsonb null,
  error_message text null,
  retry_count integer not null default 0,
  queued_by text null,
  queued_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  failed_at timestamptz null,
  cancelled_by text null,
  cancelled_at timestamptz null,
  cancel_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_report_package_foundations (
  id text primary key,
  company_id text not null,
  site_id text null,
  package_code text null,
  package_title text not null,
  package_type text not null,
  package_status text not null default 'Draft',
  scope_json jsonb null,
  manifest_json jsonb null,
  included_regulatory_item_count integer not null default 0,
  included_obligation_count integer not null default 0,
  included_compliance_assessment_count integer not null default 0,
  included_evidence_count integer not null default 0,
  included_audit_mapping_count integer not null default 0,
  included_action_count integer not null default 0,
  excluded_record_count integer not null default 0,
  restricted_evidence_count integer not null default 0,
  stale_status text null default 'Current',
  stale_reason text null,
  owner_user_id text null,
  prepared_by text null,
  prepared_at timestamptz null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_report_package_items (
  id text primary key,
  company_id text not null,
  site_id text null,
  package_id text not null references public.regulatory_report_package_foundations(id) on delete cascade,
  item_type text not null,
  item_record_id text not null,
  regulatory_item_id text null,
  obligation_id text null,
  evidence_link_id text null,
  included boolean not null default true,
  restricted boolean not null default false,
  stale boolean not null default false,
  excluded_reason text null,
  source_snapshot_json jsonb null,
  added_by text null,
  added_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_report_access_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text null references public.regulatory_reports(id) on delete set null,
  report_file_id text null references public.regulatory_report_files(id) on delete set null,
  package_id text null references public.regulatory_report_package_foundations(id) on delete set null,
  access_type text not null,
  access_status text not null,
  accessed_by text null,
  accessed_at timestamptz not null default now(),
  denied_reason text null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_report_staleness_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  report_id text null references public.regulatory_reports(id) on delete cascade,
  package_id text null references public.regulatory_report_package_foundations(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text not null,
  source_record_id text null,
  stale_reason text not null,
  detected_at timestamptz not null default now(),
  resolved_by text null,
  resolved_at timestamptz null,
  resolution_note text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_report_history_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  report_id text null,
  package_id text null,
  template_id text null,
  job_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text null,
  source_record_id text null,
  created_at timestamptz not null default now()
);

alter table public.regulatory_settings
  add column if not exists require_approval_for_external_report boolean not null default true,
  add column if not exists require_approval_for_regulator_package boolean not null default true,
  add column if not exists require_approval_for_management_review_package boolean not null default false,
  add column if not exists allow_draft_report_with_unapproved_sources boolean not null default true,
  add column if not exists block_export_if_open_critical_gap boolean not null default false,
  add column if not exists block_export_if_restricted_evidence_unapproved boolean not null default true,
  add column if not exists exclude_restricted_evidence_by_default boolean not null default true,
  add column if not exists allow_restricted_evidence_export boolean not null default false,
  add column if not exists include_evidence_manifest_by_default boolean not null default true,
  add column if not exists include_access_log_in_external_package boolean not null default false,
  add column if not exists auto_mark_report_stale_on_source_change boolean not null default true,
  add column if not exists auto_mark_report_stale_on_evidence_change boolean not null default true,
  add column if not exists auto_mark_report_stale_on_action_change boolean not null default true,
  add column if not exists auto_mark_report_stale_on_review_change boolean not null default true,
  add column if not exists auto_notify_owner_on_report_generated boolean not null default true,
  add column if not exists auto_notify_owner_on_report_failed boolean not null default true,
  add column if not exists auto_notify_owner_on_report_stale boolean not null default true,
  add column if not exists report_generation_timeout_minutes integer not null default 10,
  add column if not exists report_download_expiry_minutes integer not null default 60;

create index if not exists regulatory_reports_company_site_status_idx on public.regulatory_reports(company_id, site_id, report_status);
create index if not exists regulatory_reports_company_site_type_idx on public.regulatory_reports(company_id, site_id, report_type);
create index if not exists regulatory_reports_company_site_stale_idx on public.regulatory_reports(company_id, site_id, stale_status);
create index if not exists regulatory_reports_generated_by_idx on public.regulatory_reports(generated_by);
create index if not exists regulatory_reports_owner_user_id_idx on public.regulatory_reports(owner_user_id);
create index if not exists regulatory_reports_generated_at_idx on public.regulatory_reports(generated_at);
create index if not exists regulatory_report_source_links_lookup_idx on public.regulatory_report_source_links(report_id, source_type, source_record_id);
create index if not exists regulatory_report_sections_order_idx on public.regulatory_report_sections(report_id, section_order);
create index if not exists regulatory_report_evidence_items_link_idx on public.regulatory_report_evidence_items(report_id, evidence_link_id);
create index if not exists regulatory_report_files_status_idx on public.regulatory_report_files(report_id, file_status);
create index if not exists regulatory_report_versions_number_idx on public.regulatory_report_versions(report_id, version_number);
create index if not exists regulatory_report_generation_jobs_status_idx on public.regulatory_report_generation_jobs(company_id, site_id, job_status);
create index if not exists regulatory_report_package_foundations_status_idx on public.regulatory_report_package_foundations(company_id, site_id, package_status);
create index if not exists regulatory_report_package_items_lookup_idx on public.regulatory_report_package_items(package_id, item_type, item_record_id);
create index if not exists regulatory_report_access_events_report_idx on public.regulatory_report_access_events(report_id, accessed_at);
create index if not exists regulatory_report_history_events_report_idx on public.regulatory_report_history_events(report_id, created_at);

alter table public.regulatory_report_templates enable row level security;
alter table public.regulatory_reports enable row level security;
alter table public.regulatory_report_source_links enable row level security;
alter table public.regulatory_report_sections enable row level security;
alter table public.regulatory_report_evidence_items enable row level security;
alter table public.regulatory_report_files enable row level security;
alter table public.regulatory_report_versions enable row level security;
alter table public.regulatory_report_generation_jobs enable row level security;
alter table public.regulatory_report_package_foundations enable row level security;
alter table public.regulatory_report_package_items enable row level security;
alter table public.regulatory_report_access_events enable row level security;
alter table public.regulatory_report_staleness_events enable row level security;
alter table public.regulatory_report_history_events enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_report_templates',
    'regulatory_reports',
    'regulatory_report_source_links',
    'regulatory_report_sections',
    'regulatory_report_evidence_items',
    'regulatory_report_files',
    'regulatory_report_versions',
    'regulatory_report_generation_jobs',
    'regulatory_report_package_foundations',
    'regulatory_report_package_items',
    'regulatory_report_access_events',
    'regulatory_report_staleness_events',
    'regulatory_report_history_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_policy', table_name);
    -- Regulatory report content is served only through the application API, which
    -- uses the Supabase service-role client and enforces company/site scope.
    -- Never expose reports, generated files, snapshots, or audit history through
    -- a broad authenticated Data API policy.
    execute format('create policy %I on public.%I for all to authenticated using (false) with check (false)', table_name || '_tenant_policy', table_name);
  end loop;
end $$;

do $$
declare
  tenant_id text;
  permission_record record;
begin
  for tenant_id in select id from public."Tenant" loop
    for permission_record in
      select * from (values
        ('regulatory.report.view','View regulatory reports'),
        ('regulatory.report.dashboard.view','View regulatory report dashboard'),
        ('regulatory.report.register.view','View regulatory report register'),
        ('regulatory.report.create','Create regulatory report'),
        ('regulatory.report.generate','Generate regulatory report'),
        ('regulatory.report.regenerate','Regenerate regulatory report'),
        ('regulatory.report.preview','Preview regulatory report'),
        ('regulatory.report.download','Download regulatory report'),
        ('regulatory.report.export','Export regulatory report'),
        ('regulatory.report.archive','Archive regulatory report'),
        ('regulatory.report.lock','Lock regulatory report'),
        ('regulatory.report.unlock','Unlock regulatory report'),
        ('regulatory.report.mark_historical','Mark regulatory report historical'),
        ('regulatory.report.submit_approval','Submit regulatory report for approval'),
        ('regulatory.report.template.view','View regulatory report templates'),
        ('regulatory.report.template.create','Create regulatory report template'),
        ('regulatory.report.template.edit','Edit regulatory report template'),
        ('regulatory.report.template.archive','Archive regulatory report template'),
        ('regulatory.report.package.view','View regulatory report packages'),
        ('regulatory.report.package.create','Create regulatory report package'),
        ('regulatory.report.package.prepare','Prepare regulatory report package'),
        ('regulatory.report.package.archive','Archive regulatory report package'),
        ('regulatory.report.restricted_evidence.include','Include restricted evidence in regulatory reports'),
        ('regulatory.report.restricted_evidence.view','View restricted evidence in regulatory reports'),
        ('regulatory.report.access_log.view','View regulatory report access log'),
        ('regulatory.report.version.view','View regulatory report versions'),
        ('regulatory.report.job.view','View regulatory report jobs'),
        ('regulatory.report.job.retry','Retry regulatory report jobs'),
        ('regulatory.report.job.cancel','Cancel regulatory report jobs'),
        ('regulatory.report.history.view','View regulatory report history'),
        ('regulatory.report.settings.edit','Edit regulatory report settings')
      ) as permission_values(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_record.permission_key, 'REGULATORY', permission_record.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id and "key" = permission_record.permission_key
      );
    end loop;
  end loop;
end $$;
