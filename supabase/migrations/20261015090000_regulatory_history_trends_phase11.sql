-- Regulatory Register Phase 11: History, trends, management review readiness, and KPI feed foundation.
-- These tables are server-managed. API guards enforce tenant and site access; direct client access is denied by RLS.
create extension if not exists pgcrypto;

create table if not exists public.regulatory_unified_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  department_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  source_module text not null,
  source_table text null,
  source_record_id text null,
  regulatory_item_id text null,
  obligation_id text null,
  jurisdiction_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  event_severity text null,
  criticality text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  system_event boolean not null default false,
  restricted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_history_snapshots (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  snapshot_code text null,
  snapshot_title text not null,
  snapshot_type text not null,
  scope_json jsonb null,
  source_modules_json jsonb null,
  source_record_count integer not null default 0,
  snapshot_payload_json jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_trend_runs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  trend_code text not null,
  trend_title text not null,
  trend_type text not null,
  trend_status text not null default 'Draft',
  scope_json jsonb null,
  filter_json jsonb null,
  source_modules_json jsonb not null default '[]'::jsonb,
  date_range_start date null,
  date_range_end date null,
  compare_range_start date null,
  compare_range_end date null,
  methodology_json jsonb null,
  input_snapshot_json jsonb null,
  source_record_count integer not null default 0,
  result_summary_json jsonb null,
  trend_direction text null,
  trend_confidence text null,
  trend_severity text null,
  stale_status text not null default 'Current',
  stale_reason text null,
  owner_user_id text null,
  created_by text null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  unique(company_id, trend_code)
);

create table if not exists public.regulatory_trend_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  trend_run_id text not null references public.regulatory_trend_runs(id) on delete cascade,
  result_type text not null,
  result_title text not null,
  result_description text null,
  source_record_count integer not null default 0,
  metric_key text null,
  metric_value numeric null,
  previous_metric_value numeric null,
  trend_direction text null,
  trend_confidence text null,
  severity text null,
  criticality text null,
  explanation_json jsonb null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_trend_source_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  trend_run_id text not null references public.regulatory_trend_runs(id) on delete cascade,
  source_module text not null,
  source_record_type text not null,
  source_record_id text not null,
  regulatory_item_id text null,
  obligation_id text null,
  included boolean not null default true,
  excluded_reason text null,
  source_snapshot_json jsonb null,
  restricted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_repeat_gap_matches (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  repeat_code text null,
  repeat_title text not null,
  repeat_type text not null,
  repeat_status text not null default 'Potential Repeat',
  match_basis_json jsonb not null default '{}'::jsonb,
  match_confidence text null,
  first_occurrence_at timestamptz null,
  latest_occurrence_at timestamptz null,
  occurrence_count integer not null default 0,
  regulatory_item_id text null,
  obligation_id text null,
  jurisdiction_id text null,
  category text null,
  psm_element text null,
  criticality text null,
  owner_user_id text null,
  review_status text null,
  action_id text null,
  notes text null,
  detected_by text null,
  detected_at timestamptz not null default now(),
  confirmed_by text null,
  confirmed_at timestamptz null,
  rejected_by text null,
  rejected_at timestamptz null,
  rejection_reason text null,
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_repeat_gap_source_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  repeat_id text not null references public.regulatory_repeat_gap_matches(id) on delete cascade,
  source_module text not null,
  source_record_type text not null,
  source_record_id text not null,
  source_snapshot_json jsonb null,
  occurrence_at timestamptz null,
  added_at timestamptz not null default now(),
  unique(repeat_id, source_module, source_record_type, source_record_id)
);

create table if not exists public.regulatory_recurring_issue_clusters (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  cluster_code text null,
  cluster_title text not null,
  cluster_type text not null,
  cluster_status text not null default 'Open',
  cluster_dimension_json jsonb null,
  source_record_count integer not null default 0,
  first_seen_at timestamptz null,
  last_seen_at timestamptz null,
  trend_direction text null,
  severity text null,
  criticality text null,
  owner_user_id text null,
  management_review_candidate boolean not null default false,
  action_id text null,
  review_package_id text null,
  report_id text null,
  notes text null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_management_review_candidates (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  candidate_code text null,
  candidate_title text not null,
  candidate_type text not null,
  candidate_status text not null default 'Open',
  readiness_status text not null default 'Not Ready',
  source_module text not null,
  source_record_type text not null,
  source_record_id text not null,
  regulatory_item_id text null,
  obligation_id text null,
  jurisdiction_id text null,
  criticality text null,
  reason text not null,
  readiness_trace_json jsonb null,
  owner_user_id text null,
  review_package_id text null,
  report_id text null,
  action_id text null,
  added_by text null,
  added_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_kpi_feed_snapshots (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  snapshot_code text null,
  snapshot_title text not null,
  snapshot_status text not null default 'Generated',
  kpi_payload_json jsonb not null default '{}'::jsonb,
  source_record_count integer not null default 0,
  generated_by text null,
  generated_at timestamptz not null default now(),
  stale_status text not null default 'Current',
  stale_reason text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_trend_staleness_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  trend_run_id text null references public.regulatory_trend_runs(id) on delete cascade,
  history_snapshot_id text null references public.regulatory_history_snapshots(id) on delete cascade,
  kpi_snapshot_id text null references public.regulatory_kpi_feed_snapshots(id) on delete cascade,
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

create table if not exists public.regulatory_trend_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  trend_run_id text null references public.regulatory_trend_runs(id) on delete set null,
  repeat_id text null references public.regulatory_repeat_gap_matches(id) on delete set null,
  cluster_id text null references public.regulatory_recurring_issue_clusters(id) on delete set null,
  management_review_candidate_id text null references public.regulatory_management_review_candidates(id) on delete set null,
  kpi_snapshot_id text null references public.regulatory_kpi_feed_snapshots(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null,
  source_record_id text null,
  created_at timestamptz not null default now()
);

alter table public.regulatory_settings
  add column if not exists auto_normalize_regulatory_history_events boolean not null default true,
  add column if not exists auto_detect_repeat_regulatory_gaps boolean not null default true,
  add column if not exists auto_detect_recurring_regulatory_issues boolean not null default true,
  add column if not exists repeat_gap_min_occurrences integer not null default 2,
  add column if not exists repeat_gap_lookback_days integer not null default 365,
  add column if not exists recurring_issue_min_occurrences integer not null default 3,
  add column if not exists management_review_auto_candidate_for_critical_gap boolean not null default true,
  add column if not exists management_review_auto_candidate_for_repeat_gap boolean not null default true,
  add column if not exists management_review_auto_candidate_for_ineffective_capa boolean not null default true,
  add column if not exists management_review_auto_candidate_for_high_impact_change boolean not null default true,
  add column if not exists auto_mark_trend_run_stale_on_source_change boolean not null default true,
  add column if not exists auto_generate_kpi_feed_snapshot boolean not null default false,
  add column if not exists trend_default_lookback_days integer not null default 365,
  add column if not exists trend_min_source_count integer not null default 3;

create index if not exists regulatory_unified_history_events_scope_idx on public.regulatory_unified_history_events(company_id, site_id, created_at desc);
create index if not exists regulatory_unified_history_events_source_idx on public.regulatory_unified_history_events(company_id, source_module, source_record_id);
create unique index if not exists regulatory_unified_history_events_source_event_uidx on public.regulatory_unified_history_events(company_id, source_table, source_record_id) where source_table is not null and source_record_id is not null;
create index if not exists regulatory_unified_history_events_item_idx on public.regulatory_unified_history_events(company_id, regulatory_item_id);
create index if not exists regulatory_unified_history_events_obligation_idx on public.regulatory_unified_history_events(company_id, obligation_id);
create index if not exists regulatory_history_snapshots_scope_idx on public.regulatory_history_snapshots(company_id, site_id, snapshot_type);
create index if not exists regulatory_trend_runs_scope_idx on public.regulatory_trend_runs(company_id, site_id, trend_type, trend_status);
create index if not exists regulatory_trend_results_run_idx on public.regulatory_trend_results(trend_run_id, result_type);
create index if not exists regulatory_trend_source_records_run_idx on public.regulatory_trend_source_records(trend_run_id, source_module, source_record_id);
create index if not exists regulatory_repeat_gap_matches_scope_idx on public.regulatory_repeat_gap_matches(company_id, site_id, repeat_status);
create index if not exists regulatory_recurring_issue_clusters_scope_idx on public.regulatory_recurring_issue_clusters(company_id, site_id, cluster_status);
create index if not exists regulatory_management_review_candidates_scope_idx on public.regulatory_management_review_candidates(company_id, site_id, candidate_status);
create index if not exists regulatory_kpi_feed_snapshots_scope_idx on public.regulatory_kpi_feed_snapshots(company_id, site_id, snapshot_status);
create index if not exists regulatory_trend_history_events_run_idx on public.regulatory_trend_history_events(trend_run_id, created_at desc);

-- Capture all Phase 1-10 regulatory history records in the Phase 11 unified stream.
-- The source history tables remain authoritative; this is an immutable integration projection.
create or replace function public.regulatory_capture_unified_history_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb := to_jsonb(new);
  source_module_value text;
  source_site_id text;
  stale_reason_value text;
begin
  source_module_value := coalesce(payload->>'source_module', case tg_table_name
    when 'regulatory_history_events' then 'Regulatory Register'
    when 'regulatory_applicability_history_events' then 'Regulatory Applicability'
    when 'regulatory_obligation_history_events' then 'Regulatory Obligations'
    when 'regulatory_compliance_history_events' then 'Regulatory Compliance Status'
    when 'regulatory_evidence_history_events' then 'Regulatory Evidence'
    when 'regulatory_audit_mapping_history_events' then 'Regulatory Audit Mapping'
    when 'regulatory_action_history_events' then 'Regulatory Actions / CAPA'
    when 'regulatory_review_history_events' then 'Regulatory Review & Approval'
    when 'regulatory_report_history_events' then 'Regulatory Reports / Export'
    when 'regulatory_change_history_events' then 'Regulatory Change Management'
    else 'Regulatory'
  end);
  source_site_id := payload->>'site_id';

  insert into public.regulatory_unified_history_events (
    id, company_id, site_id, unit_id, area_id, equipment_id, source_module, source_table, source_record_id,
    regulatory_item_id, obligation_id, jurisdiction_id, event_type, event_title, event_description,
    event_severity, criticality, before_value_json, after_value_json, actor_user_id, system_event, restricted, created_at
  ) values (
    gen_random_uuid()::text, payload->>'company_id', source_site_id, payload->>'unit_id', payload->>'area_id', payload->>'equipment_id',
    source_module_value, tg_table_name, payload->>'id', payload->>'regulatory_item_id', payload->>'obligation_id', payload->>'jurisdiction_id',
    coalesce(payload->>'event_type', 'REGULATORY_EVENT'), coalesce(payload->>'event_title', source_module_value), payload->>'event_description',
    payload->>'event_severity', payload->>'criticality', payload->'before_value_json', payload->'after_value_json', payload->>'actor_user_id',
    coalesce((payload->>'system_event')::boolean, false), coalesce((payload->>'restricted')::boolean, false), coalesce((payload->>'created_at')::timestamptz, now())
  ) on conflict do nothing;

  stale_reason_value := 'Source changed: ' || coalesce(payload->>'event_title', source_module_value);
  with stale_runs as (
    update public.regulatory_trend_runs
       set stale_status = 'Stale', stale_reason = stale_reason_value
     where company_id = payload->>'company_id'
       and stale_status = 'Current'
       and (source_site_id is null or site_id = source_site_id or site_id is null)
     returning id, site_id
  )
  insert into public.regulatory_trend_staleness_events (
    id, company_id, site_id, trend_run_id, stale_trigger_type, source_module, source_record_id, stale_reason
  )
  select gen_random_uuid()::text, payload->>'company_id', stale_runs.site_id, stale_runs.id, 'Source History Event', source_module_value, payload->>'id', stale_reason_value
  from stale_runs;
  return new;
end;
$$;

do $$
declare source_table_name text;
begin
  foreach source_table_name in array array[
    'regulatory_history_events', 'regulatory_applicability_history_events', 'regulatory_obligation_history_events',
    'regulatory_compliance_history_events', 'regulatory_evidence_history_events', 'regulatory_audit_mapping_history_events',
    'regulatory_action_history_events', 'regulatory_review_history_events', 'regulatory_report_history_events', 'regulatory_change_history_events'
  ] loop
    execute format('drop trigger if exists %I on public.%I', source_table_name || '_phase11_unified_history', source_table_name);
    execute format('create trigger %I after insert on public.%I for each row execute function public.regulatory_capture_unified_history_event()', source_table_name || '_phase11_unified_history', source_table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'regulatory_unified_history_events', 'regulatory_history_snapshots', 'regulatory_trend_runs',
    'regulatory_trend_results', 'regulatory_trend_source_records', 'regulatory_repeat_gap_matches',
    'regulatory_repeat_gap_source_records', 'regulatory_recurring_issue_clusters',
    'regulatory_management_review_candidates', 'regulatory_kpi_feed_snapshots',
    'regulatory_trend_staleness_events', 'regulatory_trend_history_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_server_only_policy', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (false) with check (false)', table_name || '_server_only_policy', table_name);
  end loop;
end $$;

do $$
declare tenant_id text;
begin
  for tenant_id in select id from public."Tenant" loop
    insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
    select gen_random_uuid()::text, tenant_id, permission_key, 'REGULATORY', permission_label
    from (values
      ('regulatory.history.dashboard.view', 'View regulatory history dashboard'),
      ('regulatory.history.timeline.view', 'View regulatory history timeline'),
      ('regulatory.history.snapshot.view', 'View regulatory history snapshots'),
      ('regulatory.history.snapshot.create', 'Create regulatory history snapshots'),
      ('regulatory.trend.view', 'View regulatory trends'),
      ('regulatory.trend.dashboard.view', 'View regulatory trend dashboard'),
      ('regulatory.trend.run.view', 'View regulatory trend runs'),
      ('regulatory.trend.run.create', 'Create regulatory trend runs'),
      ('regulatory.trend.run.recalculate', 'Recalculate regulatory trend runs'),
      ('regulatory.trend.run.archive', 'Archive regulatory trend runs'),
      ('regulatory.trend.source_records.view', 'View regulatory trend source records'),
      ('regulatory.repeat_gap.view', 'View regulatory repeat gaps'),
      ('regulatory.repeat_gap.confirm', 'Confirm regulatory repeat gaps'),
      ('regulatory.repeat_gap.reject', 'Reject regulatory repeat gaps'),
      ('regulatory.repeat_gap.archive', 'Archive regulatory repeat gaps'),
      ('regulatory.recurring_issue.view', 'View regulatory recurring issues'),
      ('regulatory.recurring_issue.manage', 'Manage regulatory recurring issues'),
      ('regulatory.management_review.view', 'View management review readiness'),
      ('regulatory.management_review.dashboard.view', 'View management review readiness dashboard'),
      ('regulatory.management_review.candidate.create', 'Create management review candidates'),
      ('regulatory.management_review.candidate.edit', 'Edit management review candidates'),
      ('regulatory.management_review.candidate.remove', 'Remove management review candidates'),
      ('regulatory.kpi_feed.view', 'View regulatory KPI feed'),
      ('regulatory.kpi_feed.generate', 'Generate regulatory KPI feed'),
      ('regulatory.trend.history.view', 'View regulatory trend history'),
      ('regulatory.trend.settings.edit', 'Edit regulatory trend settings')
    ) as permissions(permission_key, permission_label)
    where not exists (select 1 from public."Permission" p where p."tenantId" = tenant_id and p."key" = permission_key);
  end loop;
end $$;
