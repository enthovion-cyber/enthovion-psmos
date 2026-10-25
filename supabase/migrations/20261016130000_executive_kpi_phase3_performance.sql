-- Executive KPI Dashboard Phase 3: scope performance cockpit.
create table if not exists public.executive_scope_performance_results (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null, department_id text null references public."Department"(id) on delete set null,
  unit_id text null references public."Unit"(id) on delete set null, area_id text null references public."Area"(id) on delete set null,
  equipment_id text null references public."Equipment"(id) on delete set null, scope_type text not null, scope_record_id text null,
  scope_label text not null, aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  performance_score_foundation numeric null, performance_status text not null, data_quality_status text not null,
  critical_alert_count integer not null default 0, high_risk_item_count integer not null default 0, overdue_action_count integer not null default 0,
  pending_approval_count integer not null default 0, stale_record_count integer not null default 0, restricted_record_count integer not null default 0,
  unavailable_module_count integer not null default 0, insufficient_data_count integer not null default 0,
  included_modules_json jsonb null, excluded_modules_json jsonb null, restricted_modules_json jsonb null, module_score_summary_json jsonb null,
  kpi_summary_json jsonb null, calculation_method_snapshot_json jsonb null, source_trace_json jsonb null,
  calculated_by text null, calculated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create unique index if not exists executive_scope_performance_company_scope_uidx on public.executive_scope_performance_results(company_id, scope_type, coalesce(scope_record_id, 'company'));
create table if not exists public.executive_scope_module_scorecards (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  department_id text null, unit_id text null, area_id text null, equipment_id text null, scope_performance_id text not null references public.executive_scope_performance_results(id) on delete cascade,
  scope_type text not null, scope_record_id text null, module_key text not null, module_label text not null, module_health_status text not null,
  module_health_score_foundation numeric null, critical_alert_count integer not null default 0, overdue_action_count integer not null default 0,
  pending_approval_count integer not null default 0, stale_record_count integer not null default 0, restricted_record_count integer not null default 0,
  source_trace_json jsonb null, calculated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.executive_scope_kpi_scorecards (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  department_id text null, unit_id text null, area_id text null, equipment_id text null, scope_performance_id text not null references public.executive_scope_performance_results(id) on delete cascade,
  kpi_code text not null, kpi_title text not null, kpi_category text null, source_module text null, kpi_value numeric null, kpi_text_value text null,
  unit text null, kpi_status text not null, threshold_status text null, trend_status_foundation text null, confidence_status text null,
  source_count integer not null default 0, restricted_count integer not null default 0, source_trace_json jsonb null, calculated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.executive_performance_comparison_sets (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  comparison_code text null, comparison_title text not null, comparison_type text not null, scope_type text not null, filter_json jsonb null,
  date_range_start timestamptz null, date_range_end timestamptz null, included_scope_count integer not null default 0, excluded_scope_count integer not null default 0,
  comparison_method_json jsonb null, generated_by text null, generated_at timestamptz not null default now(), created_at timestamptz not null default now(), archived_at timestamptz null, archived_by text null, archive_reason text null
);
create table if not exists public.executive_performance_rankings (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  comparison_set_id text null references public.executive_performance_comparison_sets(id) on delete set null, ranking_type text not null, scope_type text not null,
  scope_record_id text null, scope_label text not null, rank_position integer not null, ranking_value numeric null, ranking_status text not null, ranking_reason text null, source_trace_json jsonb null, generated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.executive_performance_heatmap_cells (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  comparison_set_id text null references public.executive_performance_comparison_sets(id) on delete set null, row_scope_type text not null, row_scope_record_id text null,
  row_label text not null, column_key text not null, column_label text not null, cell_value numeric null, cell_text_value text null, cell_status text not null,
  source_module text null, source_trace_json jsonb null, restricted boolean not null default false, unavailable boolean not null default false, insufficient_data boolean not null default false, generated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.executive_scope_drilldown_links (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  parent_scope_type text not null, parent_scope_record_id text null, child_scope_type text not null, child_scope_record_id text null, child_label text not null,
  drilldown_route text not null, restricted boolean not null default false, permission_required text null, created_at timestamptz not null default now()
);
create table if not exists public.executive_performance_snapshots (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  department_id text null, unit_id text null, area_id text null, equipment_id text null, snapshot_code text null, snapshot_title text not null, snapshot_type text not null,
  scope_type text not null, scope_record_id text null, aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  date_range_start timestamptz null, date_range_end timestamptz null, performance_score_foundation numeric null, performance_status text not null, data_quality_status text not null,
  included_modules_json jsonb null, excluded_modules_json jsonb null, restricted_modules_json jsonb null, score_summary_json jsonb null, kpi_summary_json jsonb null,
  critical_alert_summary_json jsonb null, overdue_action_summary_json jsonb null, pending_approval_summary_json jsonb null, stale_record_summary_json jsonb null,
  source_count integer not null default 0, calculation_method_snapshot_json jsonb null, generated_by text null, generated_at timestamptz not null default now(), stale_status text null, stale_reason text null, created_at timestamptz not null default now(), archived_at timestamptz null, archived_by text null, archive_reason text null
);
create table if not exists public.executive_performance_history_events (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  department_id text null, unit_id text null, area_id text null, equipment_id text null, scope_performance_id text null, snapshot_id text null,
  comparison_set_id text null, event_type text not null, event_title text not null, event_description text null, before_value_json jsonb null, after_value_json jsonb null,
  actor_user_id text null, source_module text not null, source_record_id text null, created_at timestamptz not null default now()
);
alter table public.executive_kpi_settings add column if not exists enable_site_performance_dashboard boolean not null default true, add column if not exists enable_department_performance_dashboard boolean not null default true, add column if not exists enable_unit_performance_dashboard boolean not null default true, add column if not exists enable_area_equipment_performance_foundation boolean not null default true, add column if not exists enable_performance_heatmap boolean not null default true, add column if not exists enable_performance_rankings boolean not null default true, add column if not exists enable_scope_drilldown_explorer boolean not null default true, add column if not exists default_performance_scope text not null default 'company', add column if not exists minimum_modules_for_scope_score integer not null default 3, add column if not exists hide_unauthorized_scopes boolean not null default true, add column if not exists show_restricted_scope_placeholder boolean not null default false, add column if not exists performance_snapshot_enabled boolean not null default true, add column if not exists performance_ranking_limit integer not null default 10, add column if not exists heatmap_max_rows integer not null default 100;
create index if not exists executive_scope_performance_scope_idx on public.executive_scope_performance_results(company_id, site_id, scope_type);
create index if not exists executive_scope_performance_status_idx on public.executive_scope_performance_results(company_id, site_id, performance_status);
create index if not exists executive_scope_module_scorecards_idx on public.executive_scope_module_scorecards(scope_performance_id, module_key);
create index if not exists executive_scope_kpi_scorecards_idx on public.executive_scope_kpi_scorecards(scope_performance_id, kpi_code);
create index if not exists executive_performance_comparisons_idx on public.executive_performance_comparison_sets(company_id, site_id, comparison_type);
create index if not exists executive_performance_rankings_idx on public.executive_performance_rankings(comparison_set_id, ranking_type, rank_position);
create index if not exists executive_performance_heatmap_idx on public.executive_performance_heatmap_cells(comparison_set_id, row_scope_type, column_key);
create index if not exists executive_scope_drilldown_idx on public.executive_scope_drilldown_links(parent_scope_type, parent_scope_record_id);
create index if not exists executive_performance_snapshots_idx on public.executive_performance_snapshots(company_id, site_id, snapshot_type);
create index if not exists executive_performance_history_idx on public.executive_performance_history_events(snapshot_id, created_at);
do $$ declare permission_key text; begin foreach permission_key in array array['executive.performance.view','executive.performance.dashboard.view','executive.performance.company.view','executive.performance.site.view','executive.performance.department.view','executive.performance.unit.view','executive.performance.area.view','executive.performance.equipment.view','executive.performance.compare.view','executive.performance.heatmap.view','executive.performance.ranking.view','executive.performance.drilldown.view','executive.performance.source_trace.view','executive.performance.restricted_trace.view','executive.performance.snapshot.view','executive.performance.snapshot.create','executive.performance.snapshot.archive','executive.performance.recalculate','executive.performance.settings.edit'] loop insert into public."Permission" ("id","tenantId","key","moduleKey","label") select gen_random_uuid()::text, t."id", permission_key, 'EXECUTIVE', permission_key from public."Tenant" t where not exists (select 1 from public."Permission" p where p."tenantId"=t."id" and p."key"=permission_key); end loop; end $$;
alter table public.executive_scope_performance_results enable row level security; alter table public.executive_scope_module_scorecards enable row level security; alter table public.executive_scope_kpi_scorecards enable row level security; alter table public.executive_performance_comparison_sets enable row level security; alter table public.executive_performance_rankings enable row level security; alter table public.executive_performance_heatmap_cells enable row level security; alter table public.executive_scope_drilldown_links enable row level security; alter table public.executive_performance_snapshots enable row level security; alter table public.executive_performance_history_events enable row level security;
-- API access is authenticated and scope-filtered. This project uses its server-side Supabase role for writes; no direct client policy is granted.
