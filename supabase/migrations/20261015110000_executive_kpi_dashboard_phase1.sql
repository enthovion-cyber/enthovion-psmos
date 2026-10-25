create extension if not exists pgcrypto;
create table if not exists public.executive_kpi_definitions (
  id text primary key default gen_random_uuid()::text,
  company_id text null references public."Tenant"(id) on delete cascade,
  kpi_code text not null,
  kpi_title text not null,
  kpi_description text null,
  kpi_category text not null,
  source_module text not null,
  source_record_type text null,
  calculation_method text not null,
  unit text null,
  directionality text not null,
  threshold_config_json jsonb null,
  weight_foundation numeric null,
  drilldown_route text null,
  required_permission text null,
  required_entitlement text null,
  display_order integer not null default 0,
  active boolean not null default true,
  system_defined boolean not null default false,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  unique(company_id, kpi_code)
);
create table if not exists public.executive_kpi_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    department_id text null,
    unit_id text null,
    area_id text null,
    equipment_id text null,
    kpi_definition_id text not null references public.executive_kpi_definitions(id) on delete cascade,
    kpi_code text not null,
    calculation_scope_json jsonb not null default '{}'::jsonb,
    date_range_start date null,
    date_range_end date null,
    kpi_value numeric null,
    kpi_text_value text null,
    unit text null,
    numerator numeric null,
    denominator numeric null,
    score_foundation numeric null,
    kpi_status text not null,
    threshold_status text not null,
    trend_status_foundation text null,
    confidence_status text null,
    source_count integer not null default 0,
    excluded_count integer not null default 0,
    restricted_count integer not null default 0,
    error_count integer not null default 0,
    warning_count integer not null default 0,
    source_trace_json jsonb not null default '{}'::jsonb,
    calculation_method_snapshot_json jsonb not null default '{}'::jsonb,
    calculated_by text null,
    calculated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);
create table if not exists public.executive_kpi_snapshots (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    snapshot_code text null,
    snapshot_title text not null,
    snapshot_type text not null,
    scope_json jsonb not null default '{}'::jsonb,
    date_range_start date null,
    date_range_end date null,
    overall_health_score_foundation numeric null,
    overall_status text not null,
    included_modules_json jsonb not null default '[]'::jsonb,
    excluded_modules_json jsonb not null default '[]'::jsonb,
    data_quality_status text not null,
    result_summary_json jsonb not null default '{}'::jsonb,
    source_trace_json jsonb null,
    generated_by text null,
    generated_at timestamptz not null default now(),
    stale_status text null default 'Current',
    stale_reason text null,
    created_at timestamptz not null default now(),
    archived_at timestamptz null,
    archived_by text null,
    archive_reason text null
);
create table if not exists public.executive_kpi_snapshot_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    snapshot_id text not null references public.executive_kpi_snapshots(id) on delete cascade,
    kpi_result_id text not null references public.executive_kpi_results(id) on delete restrict,
    kpi_code text not null,
    kpi_value numeric null,
    kpi_text_value text null,
    kpi_status text not null,
    threshold_status text not null,
    source_count integer not null default 0,
    created_at timestamptz not null default now()
);
create table if not exists public.executive_dashboard_widgets (
  id text primary key default gen_random_uuid()::text,
  company_id text null references public."Tenant"(id) on delete cascade,
  widget_code text not null,
  widget_title text not null,
  widget_type text not null,
  widget_category text not null,
  source_kpi_codes_json jsonb null,
  source_module text null,
  default_size text not null default 'medium',
  default_position_json jsonb null,
  required_permission text null,
  active boolean not null default true,
  system_defined boolean not null default false,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  unique(company_id, widget_code)
);
create table if not exists public.executive_dashboard_layouts (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    user_id text null,
    layout_title text not null,
    layout_scope text not null,
    layout_config_json jsonb not null default '{}'::jsonb,
    is_default boolean not null default false,
    created_by text null,
    updated_by text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create table if not exists public.executive_kpi_thresholds (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    kpi_definition_id text not null references public.executive_kpi_definitions(id) on delete cascade,
    threshold_scope text not null,
    good_min numeric null,
    good_max numeric null,
    warning_min numeric null,
    warning_max numeric null,
    high_risk_min numeric null,
    high_risk_max numeric null,
    critical_min numeric null,
    critical_max numeric null,
    target_value numeric null,
    threshold_config_json jsonb null,
    active boolean not null default true,
    created_by text null,
    updated_by text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz null,
    archived_by text null,
    archive_reason text null
);
create table if not exists public.executive_kpi_source_health (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    source_module text not null,
    adapter_status text not null,
    last_checked_at timestamptz null,
    last_success_at timestamptz null,
    records_included integer not null default 0,
    records_excluded integer not null default 0,
    restricted_records integer not null default 0,
    warning_count integer not null default 0,
    error_count integer not null default 0,
    safe_error_message text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(company_id, site_id, source_module)
);
create table if not exists public.executive_kpi_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    unit_id text null,
    area_id text null,
    equipment_id text null,
    kpi_definition_id text null references public.executive_kpi_definitions(id) on delete
  set null,
    kpi_result_id text null references public.executive_kpi_results(id) on delete
  set null,
    snapshot_id text null references public.executive_kpi_snapshots(id) on delete
  set null,
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
create table if not exists public.executive_kpi_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete
  set null,
    enable_overall_health_score boolean not null default true,
    enable_cross_module_summary boolean not null default true,
    enable_snapshot_creation boolean not null default true,
    default_date_range_days integer not null default 30,
    default_refresh_interval_minutes integer not null default 15,
    allow_user_custom_layout boolean not null default true,
    hide_restricted_kpis boolean not null default false,
    show_restricted_placeholder boolean not null default true,
    require_management_review_for_critical_status boolean not null default false,
    overall_health_weighting_json jsonb null,
    created_by text null,
    updated_by text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(company_id, site_id)
);
create index if not exists executive_kpi_definitions_code_idx on public.executive_kpi_definitions(kpi_code);
create index if not exists executive_kpi_results_scope_idx on public.executive_kpi_results(
  company_id,
  site_id,
  kpi_code,
  calculated_at desc
);
create index if not exists executive_kpi_snapshots_scope_idx on public.executive_kpi_snapshots(company_id, site_id, generated_at desc);
create index if not exists executive_kpi_snapshot_results_snapshot_idx on public.executive_kpi_snapshot_results(snapshot_id, kpi_code);
create index if not exists executive_dashboard_layouts_scope_idx on public.executive_dashboard_layouts(company_id, site_id, user_id);
create index if not exists executive_kpi_source_health_scope_idx on public.executive_kpi_source_health(company_id, site_id, source_module);
create index if not exists executive_kpi_history_events_snapshot_idx on public.executive_kpi_history_events(snapshot_id, created_at desc);
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array ['executive_kpi_definitions','executive_kpi_results','executive_kpi_snapshots','executive_kpi_snapshot_results','executive_dashboard_widgets','executive_dashboard_layouts','executive_kpi_thresholds','executive_kpi_source_health','executive_kpi_history_events','executive_kpi_settings'] loop
    execute format('alter table public.%I enable row level security', table_name);
    policy_name := table_name || '_server_only';
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (false) with check (false)',
        policy_name,
        table_name
      );
    end if;
  end loop;
end $$;
insert into public.executive_kpi_definitions (
    id,
    company_id,
    kpi_code,
    kpi_title,
    kpi_category,
    source_module,
    calculation_method,
    directionality,
    drilldown_route,
    active,
    system_defined,
    display_order
  )
select gen_random_uuid()::text,
  null,
  code,
  title,
  category,
  source_module,
  'Adapter aggregate',
  directionality,
  route,
  true,
  true,
  ordering
from (
    values (
        'overall_psm_health_score',
        'Overall PSM Health Score Foundation',
        'Overall PSM Health',
        'Executive',
        'Weighted available adapter result',
        '/executive/dashboard',
        1
      ),
(
        'critical_open_items',
        'Critical Open Items',
        'Critical Risk',
        'Executive',
        'Aggregate critical source items',
        '/executive/critical-alerts',
        2
      ),
(
        'overdue_actions',
        'Overdue Actions',
        'Actions / CAPA',
        'Action Engine',
        'Open overdue action aggregate',
        '/executive/overdue-actions',
        3
      ),
(
        'pending_approvals',
        'Pending Approvals',
        'Approvals',
        'Review & Approval',
        'Adapter aggregate',
        '/executive/pending-approvals',
        4
      ),
(
        'stale_critical_records',
        'Stale Critical Records',
        'Data Quality',
        'Executive',
        'Adapter aggregate',
        '/executive/stale-records',
        5
      ),
(
        'management_review_candidates',
        'Management Review Candidates',
        'Management Review',
        'Regulatory',
        'Adapter aggregate',
        '/executive/management-review',
        6
      ),
(
        'regulatory_active_items',
        'Regulatory Items Active',
        'Regulatory Compliance',
        'Regulatory',
        'Register aggregate',
        '/regulatory/register',
        20
      ),
(
        'regulatory_non_compliant_foundation',
        'Regulatory Non-Compliant Foundation',
        'Regulatory Compliance',
        'Regulatory',
        'Register aggregate',
        '/regulatory/non-compliant',
        21
      ),
(
        'regulatory_open_gaps',
        'Regulatory Open Gaps',
        'Regulatory Compliance',
        'Regulatory',
        'Gap aggregate',
        '/regulatory/compliance-status/gaps',
        22
      ),
(
        'regulatory_evidence_missing',
        'Regulatory Evidence Missing',
        'Evidence / Document Control',
        'Regulatory',
        'Evidence gap aggregate',
        '/regulatory/evidence',
        23
      ),
(
        'audit_open_findings',
        'Audit Findings Open',
        'Audit Compliance',
        'Audit',
        'Adapter aggregate',
        '/audit-compliance/findings',
        30
      ),
(
        'actions_open',
        'Open Actions',
        'Actions / CAPA',
        'Action Engine',
        'Action aggregate',
        '/actions',
        40
      ),
(
        'incidents_open',
        'Open Incidents',
        'Incident Management',
        'Incident',
        'Incident aggregate',
        '/incidents',
        50
      ),
(
        'high_potential_incidents',
        'High Potential Incidents',
        'Incident Management',
        'Incident',
        'Incident aggregate',
        '/incidents',
        51
      ),
(
        'mi_overdue_inspections',
        'MI Overdue Inspections',
        'Mechanical Integrity',
        'Mechanical Integrity',
        'Adapter aggregate',
        '/mechanical-integrity',
        60
      ),
(
        'training_compliance_percent',
        'Training Compliance %',
        'Training & Competency',
        'Training',
        'Adapter aggregate',
        '/training-competency',
        70
      ),
(
        'psi_completeness_percent',
        'PSI Completeness %',
        'PSI',
        'PSI',
        'Adapter aggregate',
        '/process-safety-information',
        80
      ),
(
        'moc_open',
        'Open MOC',
        'MOC',
        'MOC',
        'Adapter aggregate',
        '/moc',
        90
      ),
(
        'pssr_open',
        'Open PSSR',
        'PSSR',
        'PSSR',
        'Adapter aggregate',
        '/pssr',
        100
      ),
(
        'pha_open_studies',
        'Open PHA / HAZOP Studies',
        'HAZOP / PHA',
        'HAZOP',
        'Adapter aggregate',
        '/hazop',
        110
      ),
(
        'lopa_open_recommendations',
        'LOPA / SIL Open Recommendations',
        'LOPA / SIL',
        'LOPA',
        'Adapter aggregate',
        '/lopa',
        120
      ),
(
        'ptw_active_permits',
        'Active Permits',
        'PTW',
        'PTW',
        'Adapter aggregate',
        '/ptw',
        130
      )
  ) as seed(
    code,
    title,
    category,
    source_module,
    calculation_method,
    route,
    ordering
  )
  cross join lateral (
    select case
        when code like '%percent' then 'Higher Is Better'
        else 'Lower Is Better'
      end as directionality
  ) direction
where not exists (
    select 1
    from public.executive_kpi_definitions d
    where d.company_id is null
      and d.kpi_code = seed.code
  );
-- Complete Phase 1 catalog. Definitions without a permitted adapter intentionally return
-- Unavailable/Insufficient Data; no threshold or KPI value is fabricated in the UI.
insert into public.executive_kpi_definitions (
    id,
    company_id,
    kpi_code,
    kpi_title,
    kpi_category,
    source_module,
    calculation_method,
    directionality,
    drilldown_route,
    active,
    system_defined,
    display_order
  )
select gen_random_uuid()::text,
  null,
  code,
  title,
  category,
  source_module,
  'Adapter aggregate',
  directionality,
  route,
  true,
  true,
  ordering
from (
    values (
        'regulatory_applicable_obligations',
        'Regulatory Applicable Obligations',
        'Regulatory Compliance',
        'Regulatory',
        'Applicable obligation aggregate',
        '/regulatory/obligations',
        24
      ),
      (
        'regulatory_changes_pending_impact',
        'Regulatory Changes Pending Impact',
        'Regulatory Compliance',
        'Regulatory',
        'Change impact aggregate',
        '/regulatory/changes',
        25
      ),
      (
        'audit_overdue_findings',
        'Audit Findings Overdue',
        'Audit Compliance',
        'Audit',
        'Finding due-date aggregate',
        '/audit-compliance/findings',
        31
      ),
      (
        'audit_repeat_findings',
        'Audit Repeat Findings',
        'Audit Compliance',
        'Audit',
        'Repeat finding aggregate',
        '/audit-compliance/findings',
        32
      ),
      (
        'audit_nonconformance_score_foundation',
        'Audit Nonconformance Score Foundation',
        'Audit Compliance',
        'Audit',
        'Configured adapter aggregate',
        '/audit-compliance',
        33
      ),
      (
        'actions_open',
        'Open Actions',
        'Actions / CAPA',
        'Action Engine',
        'Action aggregate',
        '/actions',
        40
      ),
      (
        'actions_overdue',
        'Actions Overdue',
        'Actions / CAPA',
        'Action Engine',
        'Due-date aggregate',
        '/actions',
        41
      ),
      (
        'actions_critical_overdue',
        'Critical Actions Overdue',
        'Actions / CAPA',
        'Action Engine',
        'Critical due-date aggregate',
        '/actions',
        42
      ),
      (
        'actions_unassigned',
        'Actions Unassigned',
        'Actions / CAPA',
        'Action Engine',
        'Owner aggregate',
        '/actions',
        43
      ),
      (
        'actions_verification_pending',
        'Actions Verification Pending',
        'Actions / CAPA',
        'Action Engine',
        'Verification aggregate',
        '/actions',
        44
      ),
      (
        'reports_generated',
        'Reports Generated',
        'Reports / Export',
        'Reports',
        'Report aggregate',
        '/reports',
        45
      ),
      (
        'reports_official_pending',
        'Official Reports Pending',
        'Reports / Export',
        'Reports',
        'Official report aggregate',
        '/reports',
        46
      ),
      (
        'incidents_open',
        'Open Incidents',
        'Incident Management',
        'Incident',
        'Incident aggregate',
        '/incidents',
        50
      ),
      (
        'incidents_overdue_investigation',
        'Overdue Incident Investigations',
        'Incident Management',
        'Incident',
        'Investigation due-date aggregate',
        '/incidents',
        52
      ),
      (
        'incidents_psm_pse',
        'PSM / PSE Incidents',
        'Incident Management',
        'Incident',
        'PSM/PSE aggregate',
        '/incidents',
        53
      ),
      (
        'mi_overdue_inspections',
        'MI Overdue Inspections',
        'Mechanical Integrity',
        'Mechanical Integrity',
        'Inspection aggregate',
        '/mechanical-integrity',
        60
      ),
      (
        'mi_open_deficiencies',
        'MI Open Deficiencies',
        'Mechanical Integrity',
        'Mechanical Integrity',
        'Deficiency aggregate',
        '/mechanical-integrity',
        61
      ),
      (
        'mi_safety_critical_overdue',
        'MI Safety-Critical Overdue',
        'Mechanical Integrity',
        'Mechanical Integrity',
        'Critical due-date aggregate',
        '/mechanical-integrity',
        62
      ),
      (
        'training_compliance_percent',
        'Training Compliance %',
        'Training & Competency',
        'Training',
        'Compliance aggregate',
        '/training-competency',
        70
      ),
      (
        'training_expired_qualifications',
        'Expired Qualifications',
        'Training & Competency',
        'Training',
        'Qualification aggregate',
        '/training-competency',
        71
      ),
      (
        'training_psm_role_gaps',
        'PSM Role Competency Gaps',
        'Training & Competency',
        'Training',
        'Competency aggregate',
        '/training-competency',
        72
      ),
      (
        'psi_completeness_percent',
        'PSI Completeness %',
        'PSI',
        'PSI',
        'Completeness aggregate',
        '/process-safety-information',
        80
      ),
      (
        'psi_stale_critical_items',
        'PSI Stale Critical Items',
        'PSI',
        'PSI',
        'Freshness aggregate',
        '/process-safety-information',
        81
      ),
      (
        'psi_review_overdue',
        'PSI Review Overdue',
        'PSI',
        'PSI',
        'Review aggregate',
        '/process-safety-information',
        82
      ),
      (
        'moc_open',
        'Open MOC',
        'MOC',
        'MOC',
        'MOC aggregate',
        '/moc',
        90
      ),
      (
        'moc_overdue',
        'MOC Overdue',
        'MOC',
        'MOC',
        'Due-date aggregate',
        '/moc',
        91
      ),
      (
        'moc_implementation_pending',
        'MOC Implementation Pending',
        'MOC',
        'MOC',
        'Implementation aggregate',
        '/moc',
        92
      ),
      (
        'pssr_open',
        'Open PSSR',
        'PSSR',
        'PSSR',
        'PSSR aggregate',
        '/pssr',
        100
      ),
      (
        'pssr_blockers_open',
        'PSSR Blockers Open',
        'PSSR',
        'PSSR',
        'Blocker aggregate',
        '/pssr',
        101
      ),
      (
        'pssr_readiness_percent',
        'PSSR Readiness %',
        'PSSR',
        'PSSR',
        'Readiness aggregate',
        '/pssr',
        102
      ),
      (
        'pha_open_studies',
        'Open PHA / HAZOP Studies',
        'HAZOP / PHA',
        'HAZOP',
        'Study aggregate',
        '/hazop',
        110
      ),
      (
        'pha_open_actions',
        'PHA Open Actions',
        'HAZOP / PHA',
        'HAZOP',
        'Action aggregate',
        '/hazop',
        111
      ),
      (
        'pha_stale_studies',
        'PHA Stale Studies',
        'HAZOP / PHA',
        'HAZOP',
        'Freshness aggregate',
        '/hazop',
        112
      ),
      (
        'lopa_open_recommendations',
        'LOPA / SIL Open Recommendations',
        'LOPA / SIL',
        'LOPA',
        'Recommendation aggregate',
        '/lopa',
        120
      ),
      (
        'lopa_needs_recalculation',
        'LOPA Needs Recalculation',
        'LOPA / SIL',
        'LOPA',
        'Calculation state aggregate',
        '/lopa',
        121
      ),
      (
        'lopa_sil_open',
        'LOPA / SIL Open Items',
        'LOPA / SIL',
        'LOPA',
        'SIL aggregate',
        '/lopa',
        122
      ),
      (
        'ptw_active_permits',
        'Active Permits',
        'PTW',
        'PTW',
        'Permit aggregate',
        '/ptw',
        130
      ),
      (
        'ptw_overdue',
        'Overdue Permits',
        'PTW',
        'PTW',
        'Due-date aggregate',
        '/ptw',
        131
      ),
      (
        'ptw_audit_findings',
        'PTW Audit Findings',
        'PTW',
        'PTW',
        'Finding aggregate',
        '/ptw',
        132
      ),
      (
        'document_evidence_missing',
        'Missing Critical Evidence',
        'Evidence / Document Control',
        'Documents',
        'Evidence aggregate',
        '/documents',
        140
      ),
      (
        'management_review_candidates',
        'Management Review Candidates',
        'Management Review',
        'Regulatory',
        'Adapter aggregate',
        '/executive/management-review',
        150
      ),
      (
        'source_data_quality_foundation',
        'Source Data Quality Foundation',
        'Data Quality',
        'Executive',
        'Adapter health aggregate',
        '/executive/source-health',
        160
      )
  ) as seed(
    code,
    title,
    category,
    source_module,
    calculation_method,
    route,
    ordering
  )
  cross join lateral (
    select case
        when code like '%percent' then 'Higher Is Better'
        else 'Lower Is Better'
      end as directionality
  ) direction
where not exists (
    select 1
    from public.executive_kpi_definitions d
    where d.company_id is null
      and d.kpi_code = seed.code
  );
do $$
declare tenant_id text;
begin for tenant_id in
select id
from public."Tenant" loop
insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select gen_random_uuid()::text,
  tenant_id,
  k,
  l,
  'EXECUTIVE'
from (
    values (
        'executive.dashboard.view',
        'View executive dashboard'
      ),
('executive.kpi.view', 'View executive KPIs'),
(
        'executive.kpi.detail.view',
        'View executive KPI details'
      ),
(
        'executive.kpi.drilldown.view',
        'Open executive KPI drilldowns'
      ),
(
        'executive.kpi.snapshot.view',
        'View executive snapshots'
      ),
(
        'executive.kpi.snapshot.create',
        'Create executive snapshots'
      ),
('executive.kpi.refresh', 'Refresh executive KPIs'),
(
        'executive.kpi.definition.view',
        'View KPI definitions'
      ),
(
        'executive.kpi.definition.create',
        'Create KPI definitions'
      ),
(
        'executive.kpi.definition.edit',
        'Edit KPI definitions'
      ),
(
        'executive.kpi.definition.archive',
        'Archive KPI definitions'
      ),
(
        'executive.kpi.threshold.view',
        'View KPI thresholds'
      ),
(
        'executive.kpi.threshold.edit',
        'Edit KPI thresholds'
      ),
('executive.widget.view', 'View executive widgets'),
(
        'executive.widget.configure',
        'Configure executive widgets'
      ),
('executive.layout.view', 'View executive layouts'),
('executive.layout.edit', 'Edit executive layouts'),
(
        'executive.source_health.view',
        'View KPI source health'
      ),
(
        'executive.settings.view',
        'View executive settings'
      ),
(
        'executive.settings.edit',
        'Edit executive settings'
      )
  ) p(k, l)
where not exists (
    select 1
    from public."Permission" x
    where x."tenantId" = tenant_id
      and x."key" = p.k
  );
end loop;
end $$;
