-- Executive KPI Dashboard Phase 8: controlled executive report packages.
-- Report versions and manifests are append-only evidence records. Artifacts are
-- represented only after the configured document/export provider creates them.

create table if not exists public.executive_report_types (
  id text primary key, company_id text null references public."Tenant"(id) on delete restrict,
  report_type_code text not null, report_type_name text not null, description text null,
  default_classification text not null default 'Internal', active boolean not null default true,
  system_defined boolean not null default false, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists executive_report_types_company_code_idx on public.executive_report_types (coalesce(company_id, '__system__'), report_type_code);
insert into public.executive_report_types (id, company_id, report_type_code, report_type_name, description, system_defined)
values
  ('executive-report-type-board-package', null, 'BOARD_PACKAGE', 'Board PSM Performance Package', 'Controlled board-level PSM performance package.', true),
  ('executive-report-type-management-review', null, 'MANAGEMENT_REVIEW', 'Management Review Package', 'Controlled executive management review package.', true),
  ('executive-report-type-kpi-summary', null, 'KPI_SUMMARY', 'Executive KPI Summary', 'Executive KPI performance summary.', true),
  ('executive-report-type-critical-risk', null, 'CRITICAL_RISK', 'Critical Risk Report', 'Critical risk and escalation report.', true),
  ('executive-report-type-trend', null, 'TREND', 'Trend and Repeat Issue Report', 'Historical trends and repeat issue report.', true)
on conflict do nothing;

create table if not exists public.executive_report_templates (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  report_type_id text null references public.executive_report_types(id) on delete restrict,
  template_code text not null, template_name text not null, template_status text not null default 'Draft',
  confidentiality_default text not null default 'Internal', active boolean not null default true,
  created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz null,
  unique(company_id, template_code)
);
create table if not exists public.executive_report_template_versions (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  template_id text not null references public.executive_report_templates(id) on delete restrict,
  version_number integer not null, version_status text not null default 'Draft', section_definition_json jsonb not null default '[]'::jsonb,
  output_options_json jsonb not null default '{}'::jsonb, approval_config_json jsonb not null default '{}'::jsonb,
  created_by text null, created_at timestamptz not null default now(), published_at timestamptz null,
  unique(template_id, version_number)
);
create table if not exists public.executive_reporting_periods (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, period_code text not null, period_name text not null,
  period_type text not null, starts_at timestamptz not null, ends_at timestamptz not null, cut_off_at timestamptz not null,
  status text not null default 'Open', created_by text null, created_at timestamptz not null default now(), unique(company_id, period_code)
);
create table if not exists public.executive_report_audience_profiles (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  profile_code text not null, profile_name text not null, description text null, classification text not null default 'Internal',
  recipient_rules_json jsonb not null default '{}'::jsonb, active boolean not null default true, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, profile_code)
);
create table if not exists public.executive_reports (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, report_code text not null, report_title text not null,
  report_type_id text null references public.executive_report_types(id) on delete restrict,
  template_id text null references public.executive_report_templates(id) on delete restrict,
  reporting_period_id text null references public.executive_reporting_periods(id) on delete restrict,
  audience_profile_id text null references public.executive_report_audience_profiles(id) on delete restrict,
  report_status text not null default 'Draft', confidentiality text not null default 'Internal', scope_snapshot_json jsonb not null default '{}'::jsonb,
  current_version_id text null, owner_user_id text null, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz null, archive_reason text null,
  unique(company_id, report_code)
);
create table if not exists public.executive_report_versions (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  report_id text not null references public.executive_reports(id) on delete restrict, version_number integer not null,
  version_status text not null default 'Draft', template_version_id text null references public.executive_report_template_versions(id) on delete restrict,
  scope_snapshot_json jsonb not null default '{}'::jsonb, period_snapshot_json jsonb not null default '{}'::jsonb,
  source_cut_off_at timestamptz not null, readiness_status text not null default 'Not Validated', readiness_summary_json jsonb not null default '{}'::jsonb,
  approval_status text not null default 'Not Requested', publication_status text not null default 'Not Published',
  sealed_at timestamptz null, sealed_by text null, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(report_id, version_number)
);
alter table public.executive_reports add constraint executive_reports_current_version_fk foreign key (current_version_id) references public.executive_report_versions(id) on delete restrict;
create table if not exists public.executive_report_section_snapshots (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict,
  section_key text not null, section_title text not null, section_status text not null, snapshot_json jsonb not null default '{}'::jsonb, warning_json jsonb null, created_at timestamptz not null default now(), unique(report_version_id, section_key)
);
create table if not exists public.executive_report_source_manifests (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict,
  manifest_status text not null default 'Pending', cut_off_at timestamptz not null, source_summary_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), validated_at timestamptz null, validated_by text null, unique(report_version_id)
);
create table if not exists public.executive_report_manifest_items (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, manifest_id text not null references public.executive_report_source_manifests(id) on delete restrict,
  source_module text not null, source_record_type text not null, source_record_id text null, source_snapshot_id text null, observed_at timestamptz null, source_updated_at timestamptz null,
  inclusion_status text not null, restricted boolean not null default false, warning_text text null, lineage_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.executive_report_artifacts (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict,
  artifact_format text not null, artifact_status text not null default 'Queued', document_id text null, storage_reference text null, checksum text null, generated_by text null, generated_at timestamptz null, expires_at timestamptz null, error_summary text null, created_at timestamptz not null default now()
);
create table if not exists public.executive_report_release_variants (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict, variant_name text not null, classification text not null, redaction_rules_json jsonb not null default '{}'::jsonb, publication_status text not null default 'Draft', created_by text null, created_at timestamptz not null default now());
create table if not exists public.executive_report_commentary_versions (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict, section_key text not null, commentary text not null, created_by text null, created_at timestamptz not null default now());
create table if not exists public.executive_report_distribution_records (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict, release_variant_id text null references public.executive_report_release_variants(id) on delete restrict, distribution_status text not null default 'Draft', distributed_by text null, distributed_at timestamptz null, created_at timestamptz not null default now());
create table if not exists public.executive_report_distribution_recipients (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, distribution_id text not null references public.executive_report_distribution_records(id) on delete restrict, recipient_user_id text null, recipient_email text null, delivery_status text not null default 'Pending', delivered_at timestamptz null, created_at timestamptz not null default now());
create table if not exists public.executive_report_access_events (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict, artifact_id text null references public.executive_report_artifacts(id) on delete restrict, actor_id text null, event_type text not null, event_at timestamptz not null default now(), metadata_json jsonb not null default '{}'::jsonb);
create table if not exists public.executive_report_schedules (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, template_id text null references public.executive_report_templates(id) on delete restrict, schedule_name text not null, schedule_expression text not null, scope_json jsonb not null default '{}'::jsonb, active boolean not null default true, next_run_at timestamptz null, created_by text null, created_at timestamptz not null default now());
create table if not exists public.executive_report_schedule_runs (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, schedule_id text null references public.executive_report_schedules(id) on delete restrict, report_id text null references public.executive_reports(id) on delete restrict, run_status text not null default 'Queued', started_at timestamptz null, completed_at timestamptz null, error_summary text null, created_at timestamptz not null default now());
create table if not exists public.executive_report_staleness_events (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_version_id text not null references public.executive_report_versions(id) on delete restrict, stale_reason text not null, source_reference text null, detected_at timestamptz not null default now(), resolved_at timestamptz null);
create table if not exists public.executive_report_history_events (id text primary key, company_id text not null references public."Tenant"(id) on delete restrict, report_id text not null references public.executive_reports(id) on delete restrict, report_version_id text null references public.executive_report_versions(id) on delete restrict, event_type text not null, event_summary text not null, actor_id text null, event_at timestamptz not null default now(), metadata_json jsonb not null default '{}'::jsonb);

create index if not exists executive_reports_company_status_idx on public.executive_reports(company_id, report_status, updated_at desc);
create index if not exists executive_report_versions_report_idx on public.executive_report_versions(report_id, version_number desc);
create index if not exists executive_report_artifacts_version_idx on public.executive_report_artifacts(report_version_id, artifact_status);

alter table public.executive_report_types enable row level security;
alter table public.executive_report_templates enable row level security;
alter table public.executive_report_template_versions enable row level security;
alter table public.executive_reporting_periods enable row level security;
alter table public.executive_report_audience_profiles enable row level security;
alter table public.executive_reports enable row level security;
alter table public.executive_report_versions enable row level security;
alter table public.executive_report_section_snapshots enable row level security;
alter table public.executive_report_source_manifests enable row level security;
alter table public.executive_report_manifest_items enable row level security;
alter table public.executive_report_artifacts enable row level security;
alter table public.executive_report_release_variants enable row level security;
alter table public.executive_report_commentary_versions enable row level security;
alter table public.executive_report_distribution_records enable row level security;
alter table public.executive_report_distribution_recipients enable row level security;
alter table public.executive_report_access_events enable row level security;
alter table public.executive_report_schedules enable row level security;
alter table public.executive_report_schedule_runs enable row level security;
alter table public.executive_report_staleness_events enable row level security;
alter table public.executive_report_history_events enable row level security;

do $$ declare t text; begin
  foreach t in array array['executive_report_types','executive_report_templates','executive_report_template_versions','executive_reporting_periods','executive_report_audience_profiles','executive_reports','executive_report_versions','executive_report_section_snapshots','executive_report_source_manifests','executive_report_manifest_items','executive_report_artifacts','executive_report_release_variants','executive_report_commentary_versions','executive_report_distribution_records','executive_report_distribution_recipients','executive_report_access_events','executive_report_schedules','executive_report_schedule_runs','executive_report_staleness_events','executive_report_history_events'] loop
    execute format('drop policy if exists executive_phase8_tenant_access on public.%I', t);
    execute format('create policy executive_phase8_tenant_access on public.%I for all to authenticated using (company_id = coalesce(auth.jwt() ->> ''tenant_id'', auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) with check (company_id = coalesce(auth.jwt() ->> ''tenant_id'', auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))', t);
  end loop;
end $$;

-- System report types are shared read-only definitions; tenant types remain isolated.
drop policy if exists executive_phase8_system_report_types_read on public.executive_report_types;
create policy executive_phase8_system_report_types_read on public.executive_report_types for select to authenticated using (company_id is null);

-- Directly addressable report and period rows enforce selected-site context in
-- addition to tenant membership. Child records are reachable only through the
-- guarded API and retain their parent report/version foreign keys.
drop policy if exists executive_phase8_tenant_access on public.executive_reports;
create policy executive_phase8_tenant_access on public.executive_reports for all to authenticated using (
  company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
) with check (
  company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
);
drop policy if exists executive_phase8_tenant_access on public.executive_reporting_periods;
create policy executive_phase8_tenant_access on public.executive_reporting_periods for all to authenticated using (
  company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
) with check (
  company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
);

do $$ declare permission_key text; begin foreach permission_key in array array[
  'executive.report.dashboard.view','executive.report.register.view','executive.report.detail.view','executive.report.create','executive.report.edit','executive.report.validate','executive.report.generate','executive.report.preview','executive.report.publish','executive.report.archive','executive.report.history.view','executive.report.template.view','executive.report.template.manage','executive.report.period.view','executive.report.period.manage','executive.report.audience.view','executive.report.audience.manage','executive.report.artifact.view','executive.report.artifact.download','executive.report.distribution.view','executive.report.distribution.manage','executive.report.schedule.view','executive.report.schedule.manage','executive.report.approval.submit','executive.report.approval.view','executive.report.access_log.view','executive.report.settings.view','executive.report.settings.edit'
  ] loop
    insert into public."Permission" ("id","tenantId","key","moduleKey","label")
    select gen_random_uuid()::text, t.id, permission_key, 'EXECUTIVE', permission_key from public."Tenant" t
    where not exists (select 1 from public."Permission" p where p."tenantId" = t.id and p."key" = permission_key);
  end loop;
end $$;

alter table public.executive_kpi_settings
  add column if not exists enable_executive_reports boolean not null default true,
  add column if not exists executive_report_defaults_json jsonb not null default '{"requireValidatedSources":true,"defaultClassification":"Internal"}'::jsonb;
