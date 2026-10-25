-- Executive KPI Dashboard Phase 2: persisted aggregation, source trace, module health and alerts.
create table if not exists public.executive_kpi_aggregation_runs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  unit_id text null, area_id text null, equipment_id text null,
  run_code text null, run_type text not null, run_status text not null,
  scope_json jsonb not null default '{}'::jsonb,
  date_range_start timestamptz null, date_range_end timestamptz null,
  included_modules_json jsonb null, excluded_modules_json jsonb null, restricted_modules_json jsonb null,
  source_count integer not null default 0, restricted_count integer not null default 0, excluded_count integer not null default 0,
  warning_count integer not null default 0, error_count integer not null default 0, duration_ms integer null,
  safe_error_summary text null, generated_by text null, started_at timestamptz not null default now(),
  completed_at timestamptz null, failed_at timestamptz null, created_at timestamptz not null default now()
);
create table if not exists public.executive_module_health_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null, unit_id text null,
  module_key text not null, module_label text not null,
  aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  adapter_status text not null, module_health_status text not null,
  health_score_foundation numeric null check (health_score_foundation is null or (health_score_foundation >= 0 and health_score_foundation <= 100)),
  critical_item_count integer not null default 0, high_risk_item_count integer not null default 0, overdue_item_count integer not null default 0,
  pending_approval_count integer not null default 0, stale_record_count integer not null default 0, restricted_record_count integer not null default 0,
  excluded_record_count integer not null default 0, warning_count integer not null default 0, error_count integer not null default 0,
  calculation_method_snapshot_json jsonb null, source_trace_json jsonb null, calculated_by text null,
  calculated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.executive_critical_alerts (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null, unit_id text null, area_id text null, equipment_id text null,
  aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  alert_code text null, alert_title text not null, source_module text not null, source_record_type text not null, source_record_id text not null,
  severity text not null, criticality text null, alert_status text not null default 'Open', alert_reason text not null,
  ranking_score numeric null, owner_user_id text null, due_date timestamptz null, age_days integer null,
  drilldown_route text null, restricted boolean not null default false, safe_placeholder boolean not null default false,
  source_snapshot_json jsonb null, created_at timestamptz not null default now(), resolved_at timestamptz null, resolved_by text null, resolution_note text null
);
create table if not exists public.executive_kpi_source_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null, unit_id text null,
  aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  kpi_result_id text null references public.executive_kpi_results(id) on delete set null,
  module_health_result_id text null references public.executive_module_health_results(id) on delete set null,
  kpi_code text null, source_module text not null, source_record_type text not null, source_record_id text not null,
  included boolean not null default true, excluded_reason text null, restricted boolean not null default false,
  contribution numeric null, source_snapshot_json jsonb null, created_at timestamptz not null default now()
);
create table if not exists public.executive_module_source_configs (
  id text primary key default gen_random_uuid()::text,
  company_id text null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  module_key text not null, module_label text not null, adapter_enabled boolean not null default true,
  required_permission text null, required_entitlement text null, include_in_overall_health boolean not null default true,
  default_weight numeric null, critical_threshold_config_json jsonb null, stale_after_minutes integer null, active boolean not null default true,
  created_by text null, updated_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz null, archived_by text null, archive_reason text null
);
create table if not exists public.executive_aggregation_errors (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  source_module text not null, error_code text not null, safe_error_message text not null, error_severity text not null,
  retryable boolean not null default false, occurred_at timestamptz not null default now(), resolved_at timestamptz null, resolved_by text null, resolution_note text null,
  created_at timestamptz not null default now()
);
alter table public.executive_kpi_settings add column if not exists minimum_modules_for_overall_score integer not null default 5;
alter table public.executive_kpi_settings add column if not exists fail_overall_score_if_core_module_unavailable boolean not null default false;
alter table public.executive_kpi_settings add column if not exists include_restricted_modules_in_score boolean not null default false;
alter table public.executive_kpi_settings add column if not exists show_restricted_module_placeholder boolean not null default true;
alter table public.executive_kpi_settings add column if not exists module_health_cache_minutes integer not null default 15;
alter table public.executive_kpi_settings add column if not exists critical_alert_limit integer not null default 25;
alter table public.executive_kpi_settings add column if not exists critical_alert_overdue_weight numeric not null default 1.5;
alter table public.executive_kpi_settings add column if not exists critical_alert_psm_weight numeric not null default 1.5;
alter table public.executive_kpi_settings add column if not exists critical_alert_regulatory_weight numeric not null default 1.25;
alter table public.executive_kpi_settings add column if not exists overall_health_score_method text not null default 'weighted_module_average';
alter table public.executive_kpi_settings add column if not exists auto_create_snapshot_after_aggregation boolean not null default true;
alter table public.executive_kpi_settings add column if not exists auto_log_aggregation_runs boolean not null default true;
create index if not exists executive_aggregation_runs_scope_idx on public.executive_kpi_aggregation_runs(company_id, site_id, started_at desc);
create index if not exists executive_aggregation_runs_status_idx on public.executive_kpi_aggregation_runs(company_id, site_id, run_status);
create index if not exists executive_module_health_scope_idx on public.executive_module_health_results(company_id, site_id, module_key);
create index if not exists executive_module_health_calculated_idx on public.executive_module_health_results(company_id, site_id, calculated_at desc);
create index if not exists executive_critical_alerts_scope_idx on public.executive_critical_alerts(company_id, site_id, severity, ranking_score desc);
create index if not exists executive_critical_alerts_source_idx on public.executive_critical_alerts(source_module, source_record_id);
create index if not exists executive_source_records_kpi_idx on public.executive_kpi_source_records(kpi_code, source_module);
create index if not exists executive_source_records_source_idx on public.executive_kpi_source_records(source_module, source_record_id);
create index if not exists executive_source_configs_scope_idx on public.executive_module_source_configs(company_id, site_id, module_key);
create unique index if not exists executive_source_configs_global_module_idx on public.executive_module_source_configs(module_key) where company_id is null and site_id is null;
create index if not exists executive_aggregation_errors_run_idx on public.executive_aggregation_errors(aggregation_run_id, source_module);
do $$ declare table_name text; policy_name text; begin
  foreach table_name in array array['executive_kpi_aggregation_runs','executive_module_health_results','executive_critical_alerts','executive_kpi_source_records','executive_module_source_configs','executive_aggregation_errors'] loop
    execute format('alter table public.%I enable row level security', table_name);
    policy_name := table_name || '_server_only';
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format('create policy %I on public.%I for all to authenticated using (false) with check (false)', policy_name, table_name);
    end if;
  end loop;
end $$;
insert into public.executive_module_source_configs (id, company_id, module_key, module_label, required_permission)
select gen_random_uuid()::text, null, seed.module_key, seed.module_label, seed.required_permission
from (values
  ('ptw','Permit to Work','ptw.view'),('moc','Management of Change','moc.view'),('pssr','Pre-Startup Safety Review','pssr.view'),('hazop','HAZOP / PHA','hazop.view'),('lopa','LOPA / SIL','lopa.view'),('psi','Process Safety Information','psi.view'),('mechanical-integrity','Mechanical Integrity','mechanical_integrity.dashboard.view'),('incidents','Incident Investigation','incidents.view'),('training','Training & Competency','training.dashboard.view'),('audit','Audit / Compliance Assurance','audit.findings.view'),('regulatory','Regulatory Register','regulatory.register.view'),('actions','Universal Actions / CAPA','actions.view'),('review','Review & Approval',null),('reports','Reports / Export',null)
) as seed(module_key,module_label,required_permission)
where not exists (select 1 from public.executive_module_source_configs existing where existing.company_id is null and existing.site_id is null and existing.module_key = seed.module_key);
do $$ declare tenant_id text; begin
  for tenant_id in select id from public."Tenant" loop
    insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
    select gen_random_uuid()::text, tenant_id, seed.key, 'EXECUTIVE', seed.label
    from (values
      ('executive.aggregation.view','View executive aggregation'),('executive.aggregation.run','Run executive aggregation'),('executive.aggregation.history.view','View executive aggregation history'),('executive.module_health.view','View module health'),('executive.module_health.detail.view','View module health detail'),('executive.module_health.recalculate','Recalculate module health'),('executive.critical_alert.view','View executive critical alerts'),('executive.critical_alert.resolve','Resolve executive critical alerts'),('executive.site_performance.view','View executive site performance'),('executive.unit_performance.view','View executive unit performance'),('executive.source_trace.view','View executive source trace'),('executive.source_trace.restricted.view','View restricted executive source trace'),('executive.source_config.view','View executive source configuration'),('executive.source_config.edit','Edit executive source configuration'),('executive.aggregation_error.view','View aggregation errors'),('executive.aggregation_error.resolve','Resolve aggregation errors')
    ) as seed(key,label)
    where not exists (select 1 from public."Permission" p where p."tenantId" = tenant_id and p."key" = seed.key);
  end loop;
end $$;
