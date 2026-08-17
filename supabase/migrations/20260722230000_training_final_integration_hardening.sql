-- Training & Competency Phase 14 - final integration and production hardening.

create table if not exists public.training_compliance_snapshots (
  id text primary key,
  company_id text not null,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text null,
  snapshot_scope text not null,
  snapshot_scope_id text null,
  compliance_status text not null,
  compliance_score numeric null,
  matrix_status text null,
  competency_status text null,
  training_record_status text null,
  certification_status text null,
  assessment_status text null,
  sop_ack_status text null,
  moc_training_status text null,
  pssr_training_status text null,
  ptw_authorization_status text null,
  safety_critical_gap_count integer not null default 0,
  open_gap_count integer not null default 0,
  overdue_count integer not null default 0,
  expired_count integer not null default 0,
  waiver_count integer not null default 0,
  pending_approval_count integer not null default 0,
  calculated_by text null,
  calculated_at timestamptz not null default now(),
  result_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_integration_health_checks (
  id text primary key,
  company_id text not null,
  site_id text null,
  health_scope text not null,
  module_name text not null,
  integration_name text not null,
  status text not null,
  last_checked_at timestamptz not null default now(),
  issue_count integer not null default 0,
  warning_count integer not null default 0,
  error_count integer not null default 0,
  result_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_data_quality_issues (
  id text primary key,
  company_id text not null,
  site_id text null,
  unit_id text null,
  area_id text null,
  worker_id text null,
  source_module text not null,
  source_record_id text null,
  issue_type text not null,
  issue_title text not null,
  issue_description text not null,
  severity text not null,
  issue_status text not null default 'Open',
  recommended_fix text null,
  action_id text null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz null,
  resolved_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_module_sync_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  source_module text not null,
  source_record_id text null,
  target_module text not null,
  target_record_id text null,
  sync_type text not null,
  sync_status text not null,
  sync_message text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  triggered_by text null,
  triggered_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_final_hardening_checks (
  id text primary key,
  company_id text not null,
  site_id text null,
  check_category text not null,
  check_name text not null,
  check_status text not null,
  severity text not null,
  result_summary text null,
  result_json jsonb null,
  checked_by text null,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_production_hardening_settings (
  id text primary key,
  company_id text not null,
  site_id text null,
  enable_compliance_snapshots boolean not null default true,
  enable_integration_health_checks boolean not null default true,
  enable_data_quality_checks boolean not null default true,
  enable_auto_recalculate_on_training_change boolean not null default true,
  enable_auto_recalculate_on_certificate_expiry boolean not null default true,
  enable_auto_recalculate_on_sop_revision boolean not null default true,
  enable_auto_recalculate_on_moc_pssr_change boolean not null default true,
  enable_auto_ptw_authorization_recheck boolean not null default true,
  enable_final_audit_mode boolean not null default true,
  dashboard_cache_ttl_seconds integer not null default 300,
  large_export_async_threshold_rows integer not null default 5000,
  settings_json jsonb null,
  updated_by text null,
  updated_at timestamptz not null default now(),
  unique(company_id, site_id)
);

create index if not exists training_compliance_snapshots_scope_idx on public.training_compliance_snapshots(company_id, site_id, snapshot_scope, calculated_at);
create index if not exists training_compliance_snapshots_worker_idx on public.training_compliance_snapshots(company_id, worker_id, calculated_at);
create index if not exists training_integration_health_scope_idx on public.training_integration_health_checks(company_id, site_id, module_name, integration_name, last_checked_at);
create index if not exists training_data_quality_scope_idx on public.training_data_quality_issues(company_id, site_id, issue_status, severity, detected_at);
create index if not exists training_data_quality_worker_idx on public.training_data_quality_issues(company_id, worker_id, issue_status);
create index if not exists training_module_sync_events_source_idx on public.training_module_sync_events(company_id, source_module, source_record_id, triggered_at);
create index if not exists training_module_sync_events_target_idx on public.training_module_sync_events(company_id, target_module, target_record_id, triggered_at);
create index if not exists training_final_hardening_checks_scope_idx on public.training_final_hardening_checks(company_id, site_id, check_category, checked_at);
create index if not exists training_production_hardening_settings_scope_idx on public.training_production_hardening_settings(company_id, site_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_compliance_snapshots',
    'training_integration_health_checks',
    'training_data_quality_issues',
    'training_module_sync_events',
    'training_final_hardening_checks',
    'training_production_hardening_settings'
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
  tenant_row record;
  site_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    insert into public.training_production_hardening_settings (id, company_id, site_id, updated_at)
    select gen_random_uuid()::text, tenant_row.id, null, now()
    where not exists (
      select 1 from public.training_production_hardening_settings
      where company_id = tenant_row.id and site_id is null
    );

    for site_row in select id from public."Site" where "tenantId" = tenant_row.id loop
      insert into public.training_production_hardening_settings (id, company_id, site_id, updated_at)
      select gen_random_uuid()::text, tenant_row.id, site_row.id, now()
      where not exists (
        select 1 from public.training_production_hardening_settings
        where company_id = tenant_row.id and site_id = site_row.id
      );
    end loop;
  end loop;
end $$;
