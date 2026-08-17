create extension if not exists pgcrypto;

create table if not exists public.audit_history_unified_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  equipment_id text,
  source_module text not null,
  source_object_type text not null,
  source_record_id text not null,
  event_type text not null,
  event_title text not null,
  event_description text,
  event_severity text,
  criticality text,
  actor_user_id text references public."User"(id) on delete set null,
  source_snapshot_json jsonb,
  before_value_json jsonb,
  after_value_json jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_trend_runs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  trend_code text not null,
  trend_title text not null,
  trend_type text not null,
  trend_status text not null default 'Draft',
  readiness_status text not null default 'Not Calculated',
  stale_status text not null default 'Current',
  stale_reason text,
  scope_json jsonb not null default '{}'::jsonb,
  source_modules_json jsonb not null default '[]'::jsonb,
  time_period_start date not null,
  time_period_end date not null,
  compare_period_start date,
  compare_period_end date,
  filters_json jsonb,
  methodology_snapshot_json jsonb not null default '{}'::jsonb,
  input_snapshot_json jsonb not null default '{}'::jsonb,
  calculation_trace_json jsonb,
  result_summary_json jsonb,
  created_by text references public."User"(id) on delete set null,
  calculated_by text references public."User"(id) on delete set null,
  calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text references public."User"(id) on delete set null,
  archive_reason text,
  unique(company_id, trend_code)
);

create table if not exists public.audit_trend_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  trend_run_id text not null references public.audit_trend_runs(id) on delete cascade,
  result_code text,
  result_title text not null,
  result_category text not null,
  trend_direction text not null default 'Unknown',
  confidence text not null default 'Insufficient Data',
  severity text,
  criticality text,
  source_count integer not null default 0,
  matched_records_json jsonb,
  key_drivers_json jsonb,
  supporting_records_json jsonb,
  recommended_follow_up text,
  report_ready boolean not null default false,
  result_status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_repeat_finding_matches (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  source_finding_id text not null references public.audit_findings(id) on delete cascade,
  matched_finding_id text not null references public.audit_findings(id) on delete cascade,
  trend_run_id text references public.audit_trend_runs(id) on delete set null,
  match_status text not null default 'Detected',
  repeat_status text not null default 'Potential Repeat',
  match_strength numeric,
  match_criteria_json jsonb not null default '{}'::jsonb,
  match_explanation text,
  recurrence_count integer not null default 1,
  first_occurrence_at timestamptz,
  latest_occurrence_at timestamptz,
  reviewed_by text references public."User"(id) on delete set null,
  reviewed_at timestamptz,
  review_decision text,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_finding_id, matched_finding_id)
);

create table if not exists public.audit_recurring_issue_clusters (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  equipment_id text,
  cluster_code text,
  cluster_title text not null,
  cluster_type text not null default 'Recurring Issue',
  cluster_status text not null default 'Open',
  severity text,
  criticality text,
  standard_id text,
  clause_id text,
  module_key text,
  finding_type text,
  cause_category text,
  occurrence_count integer not null default 0,
  first_detected_at timestamptz,
  latest_detected_at timestamptz,
  affected_sites_json jsonb,
  affected_units_json jsonb,
  affected_equipment_json jsonb,
  linked_findings_json jsonb,
  linked_capa_json jsonb,
  recommended_follow_up text,
  owner_user_id text references public."User"(id) on delete set null,
  created_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_by text references public."User"(id) on delete set null,
  closed_at timestamptz,
  closure_note text,
  unique(company_id, cluster_code)
);

create table if not exists public.audit_trend_source_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  trend_run_id text not null references public.audit_trend_runs(id) on delete cascade,
  result_id text references public.audit_trend_results(id) on delete cascade,
  source_module text not null,
  source_object_type text not null,
  source_record_id text not null,
  source_snapshot_json jsonb,
  included boolean not null default true,
  restricted boolean not null default false,
  excluded_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_trend_metric_points (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  trend_run_id text not null references public.audit_trend_runs(id) on delete cascade,
  metric_key text not null,
  metric_label text not null,
  metric_category text not null,
  period_start date not null,
  period_end date not null,
  value numeric,
  numerator numeric,
  denominator numeric,
  unit text,
  dimension_json jsonb,
  source_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_continuous_improvement_opportunities (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  opportunity_code text,
  opportunity_title text not null,
  opportunity_type text not null,
  opportunity_status text not null default 'Open',
  source_trend_run_id text references public.audit_trend_runs(id) on delete set null,
  source_result_id text references public.audit_trend_results(id) on delete set null,
  source_finding_id text references public.audit_findings(id) on delete set null,
  source_standard_id text,
  source_clause_id text,
  source_module text,
  severity text,
  priority text,
  recommended_owner_user_id text references public."User"(id) on delete set null,
  recommended_due_date date,
  recommended_action text,
  action_engine_id text,
  manual_creation_reason text,
  created_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by text references public."User"(id) on delete set null,
  updated_at timestamptz,
  closed_by text references public."User"(id) on delete set null,
  closed_at timestamptz,
  closure_note text,
  archived_at timestamptz,
  archived_by text references public."User"(id) on delete set null,
  archive_reason text,
  unique(company_id, opportunity_code)
);

create table if not exists public.audit_trend_staleness_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  trend_run_id text not null references public.audit_trend_runs(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text not null,
  source_record_id text not null,
  stale_reason text not null,
  detected_at timestamptz not null default now(),
  resolved_by text references public."User"(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_trend_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  trend_run_id text references public.audit_trend_runs(id) on delete set null,
  result_id text references public.audit_trend_results(id) on delete set null,
  repeat_match_id text references public.audit_repeat_finding_matches(id) on delete set null,
  recurring_cluster_id text references public.audit_recurring_issue_clusters(id) on delete set null,
  opportunity_id text references public.audit_continuous_improvement_opportunities(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text not null,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text references public."User"(id) on delete set null,
  source_module text not null default 'Audit History / Trends',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_trend_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete cascade,
  repeat_detection_window_days integer not null default 1095,
  repeat_after_capa_window_days integer not null default 1095,
  minimum_matches_for_recurring_issue integer not null default 2,
  minimum_matches_for_systemic_issue integer not null default 3,
  enable_similarity_matching boolean not null default true,
  similarity_threshold numeric not null default 0.75,
  require_review_for_repeat_confirmation boolean not null default true,
  auto_detect_repeat_findings boolean not null default true,
  auto_create_recurring_issue_cluster boolean not null default true,
  auto_create_improvement_opportunity boolean not null default false,
  auto_mark_trends_stale_on_source_change boolean not null default true,
  auto_notify_owner_on_critical_trend boolean not null default true,
  auto_notify_audit_lead_on_repeat_after_capa boolean not null default true,
  settings_json jsonb,
  updated_by text references public."User"(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists audit_history_unified_events_scope_idx on public.audit_history_unified_events(company_id, site_id, occurred_at);
create index if not exists audit_history_unified_events_source_idx on public.audit_history_unified_events(source_module, source_record_id);
create index if not exists audit_history_unified_events_type_idx on public.audit_history_unified_events(event_type, criticality);
create index if not exists audit_trend_runs_status_idx on public.audit_trend_runs(company_id, site_id, trend_status);
create index if not exists audit_trend_runs_type_idx on public.audit_trend_runs(trend_type, calculated_at);
create index if not exists audit_trend_results_category_idx on public.audit_trend_results(trend_run_id, result_category);
create index if not exists audit_repeat_finding_source_idx on public.audit_repeat_finding_matches(source_finding_id);
create index if not exists audit_repeat_finding_matched_idx on public.audit_repeat_finding_matches(matched_finding_id);
create index if not exists audit_repeat_finding_status_idx on public.audit_repeat_finding_matches(company_id, site_id, repeat_status);
create index if not exists audit_recurring_issue_status_idx on public.audit_recurring_issue_clusters(company_id, site_id, cluster_status);
create index if not exists audit_recurring_issue_dimension_idx on public.audit_recurring_issue_clusters(module_key, standard_id, clause_id);
create index if not exists audit_trend_source_records_run_idx on public.audit_trend_source_records(trend_run_id, source_module);
create index if not exists audit_trend_metric_points_run_idx on public.audit_trend_metric_points(trend_run_id, metric_key, period_start);
create index if not exists audit_improvement_status_idx on public.audit_continuous_improvement_opportunities(company_id, site_id, opportunity_status);
create index if not exists audit_trend_history_events_run_idx on public.audit_trend_history_events(trend_run_id, created_at);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'audit_history_unified_events',
    'audit_trend_runs',
    'audit_trend_results',
    'audit_repeat_finding_matches',
    'audit_recurring_issue_clusters',
    'audit_trend_source_records',
    'audit_trend_metric_points',
    'audit_continuous_improvement_opportunities',
    'audit_trend_staleness_events',
    'audit_trend_history_events',
    'audit_trend_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_site_policy', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', table_name || '_tenant_site_policy', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

do $$
declare tenant_id text;
declare permission_key text;
declare permission_label text;
begin
  for tenant_id in select id from public."Tenant" loop
    foreach permission_key, permission_label in array array[
      ['audit.history.view','View audit history'],
      ['audit.history.dashboard.view','View audit history dashboard'],
      ['audit.history.timeline.view','View audit timeline'],
      ['audit.history.activity.view','View audit activity'],
      ['audit.history.snapshot.view','View audit history snapshots'],
      ['audit.trend.view','View audit trends'],
      ['audit.trend.dashboard.view','View audit trend dashboard'],
      ['audit.trend.run.create','Create audit trend run'],
      ['audit.trend.run.recalculate','Recalculate audit trend run'],
      ['audit.trend.run.archive','Archive audit trend run'],
      ['audit.trend.explainability.view','View audit trend explainability'],
      ['audit.trend.source_records.view','View audit trend source records'],
      ['audit.repeat_finding.view','View repeat findings'],
      ['audit.repeat_finding.review','Review repeat findings'],
      ['audit.repeat_finding.confirm','Confirm repeat finding'],
      ['audit.repeat_finding.reject','Reject repeat finding'],
      ['audit.recurring_issue.view','View recurring issues'],
      ['audit.recurring_issue.manage','Manage recurring issues'],
      ['audit.continuous_improvement.view','View audit continuous improvement'],
      ['audit.continuous_improvement.create','Create audit continuous improvement opportunity'],
      ['audit.continuous_improvement.edit','Edit audit continuous improvement opportunity'],
      ['audit.continuous_improvement.close','Close audit continuous improvement opportunity'],
      ['audit.continuous_improvement.create_action_foundation','Create audit improvement action foundation'],
      ['audit.trend.history.view','View audit trend history'],
      ['audit.trend.settings.view','View audit trend settings'],
      ['audit.trend.settings.edit','Edit audit trend settings']
    ] loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'AUDIT', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
