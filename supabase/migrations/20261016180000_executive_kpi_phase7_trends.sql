-- Executive KPI Dashboard Phase 7: immutable historical trend intelligence.
-- Trend results are stored independently from mutable source records so later
-- source changes can mark a run stale without rewriting historical output.

create table if not exists public.executive_trend_definitions (
  id text primary key, company_id text null references public."Tenant"(id) on delete cascade,
  trend_code text not null, trend_title text not null, trend_description text null,
  trend_category text not null, metric_type text not null, kpi_definition_id text null,
  source_module text null, scope_types_json jsonb not null default '[]'::jsonb,
  default_granularity text not null default 'Monthly', directionality text not null default 'Higher is better',
  calculation_method text not null, calculation_method_version text not null default '1',
  comparison_method text null, minimum_observation_count integer not null default 2,
  minimum_coverage_ratio numeric null, threshold_config_json jsonb null,
  required_source_modules_json jsonb not null default '[]'::jsonb,
  active boolean not null default true, system_defined boolean not null default false,
  created_by text null, updated_by text null, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), archived_at timestamptz null,
  unique(company_id, trend_code)
);

create table if not exists public.executive_trend_methodology_versions (
  id text primary key, company_id text null references public."Tenant"(id) on delete cascade,
  methodology_code text not null, version_number integer not null, description text not null,
  formula_json jsonb not null default '{}'::jsonb, input_requirements_json jsonb not null default '{}'::jsonb,
  period_rules_json jsonb not null default '{}'::jsonb, denominator_rules_json jsonb null,
  missing_data_rules_json jsonb not null default '{}'::jsonb, comparability_rules_json jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default now(), effective_until timestamptz null,
  approved_by text null, approved_at timestamptz null, created_by text null, created_at timestamptz not null default now(),
  unique(company_id, methodology_code, version_number)
);

create table if not exists public.executive_trend_runs (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, department_id text null, unit_id text null, area_id text null, equipment_id text null,
  run_code text not null, run_title text not null, run_type text not null, run_status text not null,
  scope_type text not null, scope_record_id text null, scope_snapshot_json jsonb not null default '{}'::jsonb,
  filter_json jsonb not null default '{}'::jsonb, trend_definition_id text null references public.executive_trend_definitions(id) on delete restrict,
  methodology_version_id text null references public.executive_trend_methodology_versions(id) on delete restrict,
  date_range_start timestamptz not null, date_range_end timestamptz not null,
  comparison_range_start timestamptz null, comparison_range_end timestamptz null,
  granularity text not null, time_zone text not null default 'UTC',
  included_modules_json jsonb not null default '[]'::jsonb, excluded_modules_json jsonb not null default '[]'::jsonb,
  restricted_modules_json jsonb not null default '[]'::jsonb, source_record_count integer not null default 0,
  observation_count integer not null default 0, missing_period_count integer not null default 0,
  restricted_source_count integer not null default 0, data_quality_status text not null default 'Unavailable',
  source_coverage_json jsonb not null default '{}'::jsonb, source_watermark_json jsonb null,
  result_summary_json jsonb not null default '{}'::jsonb, calculation_warning_json jsonb null,
  stale_status text not null default 'Current', stale_reason text null, supersedes_run_id text null references public.executive_trend_runs(id) on delete restrict,
  initiated_by text null, started_at timestamptz not null default now(), completed_at timestamptz null, failed_at timestamptz null,
  safe_error_summary text null, archived_at timestamptz null, archive_reason text null, created_at timestamptz not null default now(),
  unique(company_id, run_code)
);

create table if not exists public.executive_trend_series (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, trend_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  series_code text not null, series_title text not null, metric_code text not null, kpi_definition_id text null,
  source_module text null, scope_type text not null, scope_record_id text null, unit text null,
  directionality text not null, methodology_version_id text null references public.executive_trend_methodology_versions(id) on delete restrict,
  calculation_type text not null, data_quality_status text not null, source_count integer not null default 0, created_at timestamptz not null default now(),
  unique(trend_run_id, series_code)
);

create table if not exists public.executive_trend_series_points (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict,
  trend_series_id text not null references public.executive_trend_series(id) on delete restrict,
  trend_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  period_start_at timestamptz not null, period_end_at timestamptz not null, observation_as_of_at timestamptz null,
  metric_value numeric null, metric_text_value text null, numerator numeric null, denominator numeric null,
  observation_count integer not null default 0, source_count integer not null default 0,
  excluded_count integer not null default 0, restricted_count integer not null default 0,
  point_status text not null, data_quality_status text not null,
  calculation_method_snapshot_json jsonb not null default '{}'::jsonb,
  source_lineage_reference text null, warning_json jsonb null, created_at timestamptz not null default now(),
  unique(trend_series_id, period_start_at, period_end_at)
);

create table if not exists public.executive_trend_source_lineage (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, trend_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  trend_series_id text null references public.executive_trend_series(id) on delete restrict,
  point_id text null references public.executive_trend_series_points(id) on delete restrict,
  source_module text not null, source_record_type text not null, source_record_id text not null,
  source_event_id text null, source_snapshot_id text null, source_updated_at timestamptz null,
  source_observed_at timestamptz null, source_ingested_at timestamptz null,
  included boolean not null default true, excluded_reason text null, restricted boolean not null default false,
  source_hash text null, created_at timestamptz not null default now(),
  unique(trend_run_id, source_module, source_record_type, source_record_id)
);

create table if not exists public.executive_trend_comparisons (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, trend_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  comparison_type text not null, baseline_scope_json jsonb not null default '{}'::jsonb, comparison_scope_json jsonb not null default '{}'::jsonb,
  baseline_period_json jsonb not null default '{}'::jsonb, comparison_period_json jsonb not null default '{}'::jsonb,
  baseline_value numeric null, comparison_value numeric null, absolute_change numeric null, percentage_change numeric null,
  trend_direction text not null, comparability_status text not null, data_quality_status text not null,
  methodology_snapshot_json jsonb not null default '{}'::jsonb, explanation_json jsonb null, created_at timestamptz not null default now()
);

create table if not exists public.executive_repeat_issue_candidates (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, repeat_code text not null, repeat_title text not null,
  repeat_type text not null, detection_method text not null, detection_rule_version text not null,
  match_basis_json jsonb not null default '{}'::jsonb, match_quality_status text not null default 'Insufficient Data',
  repeat_status text not null default 'Potential Repeat', occurrence_count integer not null default 0,
  first_occurrence_at timestamptz null, latest_occurrence_at timestamptz null, affected_sites_count integer not null default 0,
  affected_units_count integer not null default 0, primary_source_module text null, psm_element_id text null,
  source_criticality text null, executive_priority text null, related_risk_case_id text null,
  related_capa_action_id text null, management_review_candidate_id text null, owner_user_id text null,
  reviewed_by text null, reviewed_at timestamptz null, review_reason text null,
  detected_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, repeat_code)
);

create table if not exists public.executive_repeat_issue_occurrences (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict,
  repeat_candidate_id text not null references public.executive_repeat_issue_candidates(id) on delete restrict,
  source_module text not null, source_record_type text not null, source_record_id text not null,
  canonical_identity_key text not null, occurrence_at timestamptz not null, source_classification text null,
  included boolean not null default true, excluded_reason text null, source_snapshot_reference text null,
  created_at timestamptz not null default now(), unique(repeat_candidate_id, source_module, source_record_type, source_record_id)
);

create table if not exists public.executive_repeat_issue_reviews (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict,
  repeat_candidate_id text not null references public.executive_repeat_issue_candidates(id) on delete restrict,
  decision_type text not null, decision_reason text not null, reviewed_by text not null, reviewed_at timestamptz not null default now(),
  previous_status text not null, new_status text not null, supporting_evidence_reference_id text null, created_at timestamptz not null default now()
);

create table if not exists public.executive_recurring_issue_clusters (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, cluster_code text not null, cluster_title text not null,
  cluster_type text not null, cluster_status text not null default 'Open', clustering_method text not null, rule_version text not null,
  dimension_config_json jsonb not null default '{}'::jsonb, confirmed_occurrence_count integer not null default 0,
  affected_sites_count integer not null default 0, affected_units_count integer not null default 0,
  first_seen_at timestamptz null, last_seen_at timestamptz null, severity text null, trend_direction text not null default 'Unknown',
  data_quality_status text not null default 'Unavailable', owner_user_id text null, review_status text not null default 'Pending',
  management_review_candidate_id text null, created_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz null, archive_reason text null,
  unique(company_id, cluster_code)
);

create table if not exists public.executive_recurring_issue_cluster_members (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict,
  cluster_id text not null references public.executive_recurring_issue_clusters(id) on delete restrict,
  repeat_candidate_id text null references public.executive_repeat_issue_candidates(id) on delete restrict,
  source_module text not null, source_record_type text not null, source_record_id text not null,
  included boolean not null default true, inclusion_reason text null, excluded_reason text null, created_at timestamptz not null default now(),
  unique(cluster_id, source_module, source_record_type, source_record_id)
);

create table if not exists public.executive_trend_insights (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, insight_code text not null, insight_title text not null,
  insight_type text not null, insight_summary text not null, insight_status text not null default 'Active',
  trend_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  trend_series_id text null references public.executive_trend_series(id) on delete restrict,
  repeat_candidate_id text null references public.executive_repeat_issue_candidates(id) on delete restrict,
  cluster_id text null references public.executive_recurring_issue_clusters(id) on delete restrict,
  source_module text null, psm_element_id text null, rule_code text not null, rule_version text not null,
  baseline_value numeric null, current_value numeric null, comparison_period_json jsonb null,
  data_quality_status text not null, explanation_json jsonb not null default '{}'::jsonb,
  reviewed_by text null, reviewed_at timestamptz null, review_reason text null, management_review_candidate_id text null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, insight_code)
);

create table if not exists public.executive_trend_alert_rules (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, rule_code text not null, rule_title text not null, rule_type text not null,
  metric_code text null, scope_config_json jsonb not null default '{}'::jsonb, trigger_config_json jsonb not null default '{}'::jsonb,
  minimum_data_quality text not null default 'Observed', minimum_observation_count integer not null default 2,
  severity text not null, recipient_roles_json jsonb not null default '[]'::jsonb, recipient_users_json jsonb null,
  cooldown_minutes integer null, notification_enabled boolean not null default false, escalation_enabled boolean not null default false,
  management_review_candidate_enabled boolean not null default false, rule_version integer not null default 1,
  effective_from timestamptz not null default now(), effective_until timestamptz null, approved_by text null, approved_at timestamptz null,
  active boolean not null default false, created_by text null, updated_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, site_id, rule_code, rule_version)
);

create table if not exists public.executive_trend_alerts (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, alert_code text not null, alert_title text not null,
  alert_type text not null, alert_status text not null default 'Active', alert_severity text not null,
  trend_run_id text not null references public.executive_trend_runs(id) on delete restrict,
  insight_id text null references public.executive_trend_insights(id) on delete restrict,
  repeat_candidate_id text null references public.executive_repeat_issue_candidates(id) on delete restrict,
  rule_id text null references public.executive_trend_alert_rules(id) on delete restrict, rule_version integer null,
  deduplication_key text not null, trigger_details_json jsonb not null default '{}'::jsonb,
  data_quality_status text not null, owner_user_id text null, acknowledged_by text null, acknowledged_at timestamptz null,
  escalation_id text null, management_review_candidate_id text null, created_at timestamptz not null default now(),
  resolved_at timestamptz null, resolution_reason text null, updated_at timestamptz not null default now(), unique(company_id, deduplication_key)
);

create table if not exists public.executive_trend_management_review_candidates (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, candidate_code text not null,
  candidate_title text not null, candidate_type text not null, candidate_status text not null default 'Open',
  trend_run_id text null references public.executive_trend_runs(id) on delete restrict,
  insight_id text null references public.executive_trend_insights(id) on delete restrict,
  repeat_candidate_id text null references public.executive_repeat_issue_candidates(id) on delete restrict,
  cluster_id text null references public.executive_recurring_issue_clusters(id) on delete restrict,
  alert_id text null references public.executive_trend_alerts(id) on delete restrict,
  source_snapshot_json jsonb not null default '{}'::jsonb, data_quality_status text not null,
  original_summary text not null, created_by text null, discussed_at timestamptz null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, candidate_code)
);

create table if not exists public.executive_trend_generation_jobs (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict, trend_run_id text null references public.executive_trend_runs(id) on delete restrict,
  job_code text not null, job_type text not null, job_status text not null, progress_percent integer not null default 0,
  retry_count integer not null default 0, idempotency_key text not null, queued_by text null, queued_at timestamptz not null default now(),
  started_at timestamptz null, completed_at timestamptz null, failed_at timestamptz null, cancelled_at timestamptz null, cancelled_by text null,
  safe_error_code text null, safe_error_message text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, idempotency_key)
);

create table if not exists public.executive_trend_staleness_events (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict,
  trend_run_id text null references public.executive_trend_runs(id) on delete restrict,
  trend_series_id text null references public.executive_trend_series(id) on delete restrict,
  source_module text not null, source_record_id text null, stale_trigger_type text not null, stale_reason text not null,
  detected_at timestamptz not null default now(), resolved_by text null, resolved_at timestamptz null, resolution_note text null, created_at timestamptz not null default now()
);

create table if not exists public.executive_trend_history_events (
  id text primary key, company_id text not null references public."Tenant"(id) on delete restrict,
  site_id text null references public."Site"(id) on delete restrict,
  trend_run_id text null references public.executive_trend_runs(id) on delete restrict,
  repeat_candidate_id text null references public.executive_repeat_issue_candidates(id) on delete restrict,
  cluster_id text null references public.executive_recurring_issue_clusters(id) on delete restrict,
  insight_id text null references public.executive_trend_insights(id) on delete restrict,
  alert_id text null references public.executive_trend_alerts(id) on delete restrict,
  event_type text not null, event_title text not null, event_description text null,
  before_value_json jsonb null, after_value_json jsonb null, actor_user_id text null,
  source_module text null, source_record_id text null, correlation_id text null, created_at timestamptz not null default now()
);

create index if not exists executive_trend_runs_scope_idx on public.executive_trend_runs(company_id, site_id, run_status);
create index if not exists executive_trend_runs_started_idx on public.executive_trend_runs(company_id, site_id, started_at desc);
create index if not exists executive_trend_series_run_idx on public.executive_trend_series(trend_run_id, series_code);
create index if not exists executive_trend_points_series_idx on public.executive_trend_series_points(trend_series_id, period_start_at);
create index if not exists executive_trend_points_run_idx on public.executive_trend_series_points(trend_run_id, period_start_at);
create index if not exists executive_trend_lineage_run_idx on public.executive_trend_source_lineage(trend_run_id, source_module);
create index if not exists executive_repeat_scope_idx on public.executive_repeat_issue_candidates(company_id, site_id, repeat_status);
create index if not exists executive_repeat_occurrence_idx on public.executive_repeat_issue_occurrences(repeat_candidate_id, occurrence_at);
create index if not exists executive_cluster_scope_idx on public.executive_recurring_issue_clusters(company_id, site_id, cluster_status);
create index if not exists executive_trend_insight_scope_idx on public.executive_trend_insights(company_id, site_id, insight_status);
create index if not exists executive_trend_alert_scope_idx on public.executive_trend_alerts(company_id, site_id, alert_status);
create index if not exists executive_trend_alert_severity_idx on public.executive_trend_alerts(company_id, alert_severity, created_at desc);
create index if not exists executive_trend_review_candidate_scope_idx on public.executive_trend_management_review_candidates(company_id, site_id, candidate_status);

do $$
declare permission_key text;
begin
  foreach permission_key in array array[
    'executive.trend.dashboard.view','executive.trend.explorer.view','executive.trend.kpi.view','executive.trend.module.view','executive.trend.psm_element.view','executive.trend.run.view','executive.trend.run.create','executive.trend.run.recalculate','executive.trend.run.cancel','executive.trend.run.archive','executive.trend.methodology.view','executive.trend.methodology.manage',
    'executive.trend.site.view','executive.trend.unit.view','executive.trend.department.view','executive.trend.compare.view','executive.trend.cross_site_compare.view','executive.trend.heatmap.view',
    'executive.trend.repeat_issue.view','executive.trend.repeat_issue.detect','executive.trend.repeat_issue.confirm','executive.trend.repeat_issue.reject','executive.trend.repeat_issue.create_action','executive.trend.recurring_cluster.view','executive.trend.recurring_cluster.manage',
    'executive.trend.escalation.view','executive.trend.management_review.view','executive.trend.worsening.view','executive.trend.insight.view','executive.trend.insight.review','executive.trend.alert.view','executive.trend.alert.acknowledge','executive.trend.alert.resolve','executive.trend.alert_rule.view','executive.trend.alert_rule.manage','executive.trend.management_review_candidate.create',
    'executive.trend.source_trace.view','executive.trend.restricted_trace.view','executive.trend.data_quality.view','executive.trend.history.view','executive.trend.settings.view','executive.trend.settings.edit'
  ] loop
    insert into public."Permission" ("id","tenantId","key","moduleKey","label")
    select gen_random_uuid()::text, t.id, permission_key, 'EXECUTIVE', permission_key from public."Tenant" t
    where not exists (select 1 from public."Permission" p where p."tenantId" = t.id and p."key" = permission_key);
  end loop;
end $$;

alter table public.executive_kpi_settings
  add column if not exists enable_executive_trends boolean not null default true,
  add column if not exists executive_trend_defaults_json jsonb not null default '{"granularity":"Monthly","minimumObservationCount":2,"historicalReconstruction":"Verified snapshots only","automaticEscalation":false}'::jsonb;

do $$
declare
  trend_table_name text;
  has_site_scope boolean;
begin
  foreach trend_table_name in array array[
    'executive_trend_definitions','executive_trend_methodology_versions','executive_trend_runs','executive_trend_series','executive_trend_series_points','executive_trend_source_lineage','executive_trend_comparisons','executive_repeat_issue_candidates','executive_repeat_issue_occurrences','executive_repeat_issue_reviews','executive_recurring_issue_clusters','executive_recurring_issue_cluster_members','executive_trend_insights','executive_trend_alert_rules','executive_trend_alerts','executive_trend_management_review_candidates','executive_trend_generation_jobs','executive_trend_staleness_events','executive_trend_history_events'
  ] loop
    execute format('alter table public.%I enable row level security', trend_table_name);
    execute format('drop policy if exists executive_phase7_tenant_site_isolation on public.%I', trend_table_name);
    select exists (
      select 1 from information_schema.columns columns
      where columns.table_schema = 'public'
        and columns.table_name = trend_table_name
        and columns.column_name = 'site_id'
    ) into has_site_scope;
    if has_site_scope then
      execute format($policy$
        create policy executive_phase7_tenant_site_isolation on public.%I for all to authenticated
        using (
          company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
          and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
        ) with check (
          company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id')
          and (site_id is null or nullif(current_setting('app.current_site_id', true), '') is null or site_id = current_setting('app.current_site_id', true))
        )
      $policy$, trend_table_name);
    else
      execute format($policy$
        create policy executive_phase7_tenant_site_isolation on public.%I for all to authenticated
        using (company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
        with check (company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt() -> 'app_metadata' ->> 'tenantId', auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
      $policy$, trend_table_name);
    end if;
  end loop;
end $$;
