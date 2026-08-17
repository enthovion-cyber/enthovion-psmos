create extension if not exists pgcrypto;

create table if not exists public.audit_standards (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  standard_code text not null,
  standard_name text not null,
  standard_type text not null default 'Company Standard',
  jurisdiction text,
  issuing_body text,
  version text,
  effective_date date,
  applicability text,
  standard_status text not null default 'Draft',
  owner_user_id text references public."User"(id) on delete set null,
  notes text,
  regulatory_register_id text,
  created_by text references public."User"(id) on delete set null,
  updated_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text references public."User"(id) on delete set null,
  archive_reason text
);
create unique index if not exists audit_standards_company_site_code_uidx on public.audit_standards(company_id, coalesce(site_id, ''), standard_code);
create index if not exists audit_standards_status_idx on public.audit_standards(company_id, site_id, standard_status);
create index if not exists audit_standards_type_idx on public.audit_standards(company_id, standard_type);

create table if not exists public.audit_standard_clauses (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  standard_id text not null references public.audit_standards(id) on delete cascade,
  parent_clause_id text references public.audit_standard_clauses(id) on delete set null,
  clause_code text not null,
  clause_title text not null,
  clause_summary text,
  requirement_category text,
  applicability text,
  mandatory boolean not null default true,
  evidence_expectation text,
  audit_expectation text,
  linked_module text,
  criticality text not null default 'Medium',
  verification_method_foundation text,
  regulatory_obligation_id text,
  created_by text references public."User"(id) on delete set null,
  updated_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text references public."User"(id) on delete set null,
  archive_reason text
);
create unique index if not exists audit_standard_clauses_standard_code_uidx on public.audit_standard_clauses(standard_id, clause_code);
create index if not exists audit_standard_clauses_company_site_idx on public.audit_standard_clauses(company_id, site_id);
create index if not exists audit_standard_clauses_criticality_idx on public.audit_standard_clauses(company_id, criticality);

create table if not exists public.audit_standard_mappings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  equipment_id text,
  standard_id text not null references public.audit_standards(id) on delete restrict,
  clause_id text references public.audit_standard_clauses(id) on delete set null,
  mapping_code text not null,
  mapping_title text not null,
  mapping_status text not null default 'Draft',
  coverage_status text not null default 'Not Mapped',
  evidence_mapping_status text not null default 'Missing',
  finding_mapping_status text not null default 'No Findings',
  capa_mapping_status text not null default 'Not Required',
  score_mapping_status text not null default 'Not Scored',
  mapping_health_status text not null default 'Unknown',
  stale_status text not null default 'Current',
  stale_reason text,
  source_object_type text,
  source_module text,
  source_record_id text,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  program_id text references public.audit_programs(id) on delete set null,
  plan_id text references public.audit_plans(id) on delete set null,
  checklist_id text references public.audit_checklist_templates(id) on delete set null,
  checklist_section_id text,
  checklist_item_id text,
  execution_id text references public.audit_executions(id) on delete set null,
  response_id text,
  evidence_id text,
  finding_id text references public.audit_findings(id) on delete set null,
  capa_id text references public.audit_capa_packages(id) on delete set null,
  score_run_id text references public.audit_score_runs(id) on delete set null,
  module_key text,
  module_record_id text,
  primary_mapping boolean not null default false,
  manual_mapping boolean not null default false,
  manual_mapping_reason text,
  applicability_statement text,
  exclusions text,
  applicability_justification text,
  ready_for_review boolean not null default false,
  ready_for_report boolean not null default false,
  verified_by text references public."User"(id) on delete set null,
  verified_at timestamptz,
  created_by text references public."User"(id) on delete set null,
  updated_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text references public."User"(id) on delete set null,
  archive_reason text
);
create unique index if not exists audit_standard_mappings_company_code_uidx on public.audit_standard_mappings(company_id, mapping_code);
create index if not exists audit_standard_mappings_scope_idx on public.audit_standard_mappings(company_id, site_id, unit_id, area_id);
create index if not exists audit_standard_mappings_standard_clause_idx on public.audit_standard_mappings(standard_id, clause_id);
create index if not exists audit_standard_mappings_source_idx on public.audit_standard_mappings(source_object_type, source_record_id);
create index if not exists audit_standard_mappings_status_idx on public.audit_standard_mappings(company_id, mapping_status, coverage_status, mapping_health_status);
create index if not exists audit_standard_mappings_stale_idx on public.audit_standard_mappings(company_id, stale_status);

create table if not exists public.audit_standard_mapping_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  mapping_id text not null references public.audit_standard_mappings(id) on delete cascade,
  linked_object_type text not null,
  linked_module text,
  linked_record_id text not null,
  link_role text not null default 'Traceability',
  link_status text not null default 'Active',
  source_snapshot_json jsonb not null default '{}'::jsonb,
  linked_by text references public."User"(id) on delete set null,
  linked_at timestamptz not null default now(),
  removed_by text references public."User"(id) on delete set null,
  removed_at timestamptz,
  remove_reason text
);
create index if not exists audit_standard_mapping_links_mapping_idx on public.audit_standard_mapping_links(mapping_id, link_status);
create index if not exists audit_standard_mapping_links_record_idx on public.audit_standard_mapping_links(linked_object_type, linked_record_id);

create table if not exists public.audit_standard_coverage_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  standard_id text references public.audit_standards(id) on delete cascade,
  clause_id text references public.audit_standard_clauses(id) on delete cascade,
  program_id text references public.audit_programs(id) on delete set null,
  plan_id text references public.audit_plans(id) on delete set null,
  checklist_id text references public.audit_checklist_templates(id) on delete set null,
  execution_id text references public.audit_executions(id) on delete set null,
  module_key text,
  coverage_scope text not null default 'Company',
  coverage_status text not null default 'Not Mapped',
  evidence_status text not null default 'Missing',
  finding_status text not null default 'No Findings',
  capa_status text not null default 'Not Required',
  score_status text not null default 'Not Scored',
  mapping_health_status text not null default 'Unknown',
  coverage_percent numeric,
  evidence_count integer not null default 0,
  finding_count integer not null default 0,
  open_finding_count integer not null default 0,
  capa_count integer not null default 0,
  overdue_capa_count integer not null default 0,
  latest_score numeric,
  latest_score_run_id text references public.audit_score_runs(id) on delete set null,
  result_json jsonb not null default '{}'::jsonb,
  calculated_by text references public."User"(id) on delete set null,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists audit_standard_coverage_scope_idx on public.audit_standard_coverage_records(company_id, site_id, standard_id, clause_id);
create index if not exists audit_standard_coverage_health_idx on public.audit_standard_coverage_records(company_id, mapping_health_status);

create table if not exists public.audit_standard_mapping_gaps (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  standard_id text references public.audit_standards(id) on delete cascade,
  clause_id text references public.audit_standard_clauses(id) on delete cascade,
  mapping_id text references public.audit_standard_mappings(id) on delete set null,
  source_module text,
  source_record_id text,
  gap_type text not null,
  gap_title text not null,
  gap_description text,
  gap_status text not null default 'Open',
  gap_severity text not null default 'Medium',
  criticality text,
  owner_user_id text references public."User"(id) on delete set null,
  due_date date,
  recommended_fix text,
  action_id text,
  detected_at timestamptz not null default now(),
  resolved_by text references public."User"(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists audit_standard_mapping_gaps_status_idx on public.audit_standard_mapping_gaps(company_id, site_id, gap_status, gap_severity);
create index if not exists audit_standard_mapping_gaps_clause_idx on public.audit_standard_mapping_gaps(standard_id, clause_id);

create table if not exists public.audit_standard_mapping_overrides (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  mapping_id text not null references public.audit_standard_mappings(id) on delete cascade,
  override_type text not null,
  override_value_json jsonb not null default '{}'::jsonb,
  override_reason text not null,
  risk_compliance_justification text,
  approval_required boolean not null default true,
  approval_request_id text,
  override_status text not null default 'Pending Approval',
  created_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_by text references public."User"(id) on delete set null,
  approved_at timestamptz,
  rejected_by text references public."User"(id) on delete set null,
  rejected_at timestamptz,
  rejection_reason text,
  removed_by text references public."User"(id) on delete set null,
  removed_at timestamptz,
  remove_reason text
);
create index if not exists audit_standard_mapping_overrides_mapping_idx on public.audit_standard_mapping_overrides(mapping_id, override_status);

create table if not exists public.audit_standard_traceability_snapshots (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  mapping_id text not null references public.audit_standard_mappings(id) on delete cascade,
  standard_id text references public.audit_standards(id) on delete cascade,
  clause_id text references public.audit_standard_clauses(id) on delete set null,
  traceability_json jsonb not null default '{}'::jsonb,
  restricted_links_count integer not null default 0,
  missing_links_count integer not null default 0,
  snapshot_status text not null default 'Generated',
  generated_by text references public."User"(id) on delete set null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists audit_standard_traceability_snapshots_mapping_idx on public.audit_standard_traceability_snapshots(mapping_id, generated_at desc);

create table if not exists public.audit_standard_mapping_staleness_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  mapping_id text not null references public.audit_standard_mappings(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text,
  source_record_id text,
  stale_reason text not null,
  detected_at timestamptz not null default now(),
  resolved_by text references public."User"(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);
create index if not exists audit_standard_mapping_stale_mapping_idx on public.audit_standard_mapping_staleness_events(mapping_id, detected_at desc);

create table if not exists public.audit_standard_mapping_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  unit_id text references public."Unit"(id) on delete set null,
  area_id text references public."Area"(id) on delete set null,
  standard_id text references public.audit_standards(id) on delete set null,
  clause_id text references public.audit_standard_clauses(id) on delete set null,
  mapping_id text references public.audit_standard_mappings(id) on delete set null,
  program_id text references public.audit_programs(id) on delete set null,
  plan_id text references public.audit_plans(id) on delete set null,
  execution_id text references public.audit_executions(id) on delete set null,
  finding_id text references public.audit_findings(id) on delete set null,
  capa_id text references public.audit_capa_packages(id) on delete set null,
  evidence_id text,
  score_run_id text references public.audit_score_runs(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text references public."User"(id) on delete set null,
  source_module text,
  source_record_id text,
  created_at timestamptz not null default now()
);
create index if not exists audit_standard_mapping_history_mapping_idx on public.audit_standard_mapping_history_events(mapping_id, created_at desc);
create index if not exists audit_standard_mapping_history_scope_idx on public.audit_standard_mapping_history_events(company_id, site_id, created_at desc);

create table if not exists public.audit_standard_mapping_settings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text references public."Site"(id) on delete cascade,
  require_clause_for_mapping boolean not null default true,
  require_source_object_for_mapping boolean not null default true,
  require_scope_for_mapping boolean not null default true,
  require_evidence_for_verified_mapping boolean not null default true,
  require_score_for_report_ready boolean not null default false,
  allow_manual_mapping boolean not null default true,
  require_reason_for_manual_mapping boolean not null default true,
  allow_mapping_override boolean not null default true,
  require_approval_for_mapping_override boolean not null default true,
  auto_create_gap_for_missing_mapping boolean not null default true,
  auto_create_gap_for_missing_evidence boolean not null default true,
  auto_mark_stale_on_source_change boolean not null default true,
  settings_json jsonb not null default '{}'::jsonb,
  updated_by text references public."User"(id) on delete set null,
  updated_at timestamptz not null default now()
);
create unique index if not exists audit_standard_mapping_settings_company_site_uidx on public.audit_standard_mapping_settings(company_id, coalesce(site_id, ''));

alter table public.audit_standards enable row level security;
alter table public.audit_standard_clauses enable row level security;
alter table public.audit_standard_mappings enable row level security;
alter table public.audit_standard_mapping_links enable row level security;
alter table public.audit_standard_coverage_records enable row level security;
alter table public.audit_standard_mapping_gaps enable row level security;
alter table public.audit_standard_mapping_overrides enable row level security;
alter table public.audit_standard_traceability_snapshots enable row level security;
alter table public.audit_standard_mapping_staleness_events enable row level security;
alter table public.audit_standard_mapping_history_events enable row level security;
alter table public.audit_standard_mapping_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'audit_standards',
    'audit_standard_clauses',
    'audit_standard_mappings',
    'audit_standard_mapping_links',
    'audit_standard_coverage_records',
    'audit_standard_mapping_gaps',
    'audit_standard_mapping_overrides',
    'audit_standard_traceability_snapshots',
    'audit_standard_mapping_staleness_events',
    'audit_standard_mapping_history_events',
    'audit_standard_mapping_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_policy', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', table_name || '_tenant_policy', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

do $$
declare
  permission_pair text[];
  permission_label text;
  tenant_row record;
  permission_rows text[][] := array[
    array['audit.standards_mapping.view','View standards mapping'],
    array['audit.standards_mapping.dashboard.view','View standards mapping dashboard'],
    array['audit.standards_mapping.register.view','View standards mapping register'],
    array['audit.standards_mapping.standard.view','View audit standards'],
    array['audit.standards_mapping.standard.create','Create audit standards'],
    array['audit.standards_mapping.standard.edit','Edit audit standards'],
    array['audit.standards_mapping.standard.archive','Archive audit standards'],
    array['audit.standards_mapping.clause.view','View audit clauses'],
    array['audit.standards_mapping.clause.create','Create audit clauses'],
    array['audit.standards_mapping.clause.edit','Edit audit clauses'],
    array['audit.standards_mapping.clause.archive','Archive audit clauses'],
    array['audit.standards_mapping.mapping.view','View standard mappings'],
    array['audit.standards_mapping.mapping.create','Create standard mappings'],
    array['audit.standards_mapping.mapping.edit','Edit standard mappings'],
    array['audit.standards_mapping.mapping.link','Link mapped records'],
    array['audit.standards_mapping.mapping.unlink','Unlink mapped records'],
    array['audit.standards_mapping.mapping.verify','Verify standard mappings'],
    array['audit.standards_mapping.mapping.archive','Archive standard mappings'],
    array['audit.standards_mapping.coverage.view','View mapping coverage'],
    array['audit.standards_mapping.coverage.recalculate','Recalculate mapping coverage'],
    array['audit.standards_mapping.traceability.view','View mapping traceability'],
    array['audit.standards_mapping.gap.view','View mapping gaps'],
    array['audit.standards_mapping.gap.manage','Manage mapping gaps'],
    array['audit.standards_mapping.override.create','Create mapping overrides'],
    array['audit.standards_mapping.override.approve','Approve mapping overrides'],
    array['audit.standards_mapping.override.remove','Remove mapping overrides'],
    array['audit.standards_mapping.stale.view','View stale mappings'],
    array['audit.standards_mapping.history.view','View mapping history'],
    array['audit.standards_mapping.settings.view','View mapping settings'],
    array['audit.standards_mapping.settings.edit','Edit mapping settings']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_pair slice 1 in array permission_rows loop
      permission_label := permission_pair[2];
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_pair[1], 'AUDIT', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_pair[1]
      );
    end loop;
  end loop;
end $$;
