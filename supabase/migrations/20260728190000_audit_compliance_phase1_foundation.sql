create extension if not exists pgcrypto;

create table if not exists public.audit_programs (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_code text not null,
  program_title text not null,
  description text null,
  audit_type text not null,
  program_category text not null,
  criticality text not null,
  program_status text not null default 'Draft',
  configuration_health text not null default 'Missing Scope',
  effective_date date null,
  program_objective text null,
  notes text null,
  owner_user_id text null references public."User"(id) on delete set null,
  reviewer_user_id text null references public."User"(id) on delete set null,
  approval_owner_user_id text null references public."User"(id) on delete set null,
  audit_lead_role text null,
  responsible_department_id text null,
  escalation_owner_user_id text null references public."User"(id) on delete set null,
  next_review_due date null,
  ready_for_scheduling boolean not null default false,
  created_by text null references public."User"(id) on delete set null,
  updated_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null references public."User"(id) on delete set null,
  archive_reason text null,
  constraint audit_programs_status_chk check (program_status in ('Draft','Active','Inactive','Pending Review','Approved','Review Overdue','Configuration Incomplete','Ready For Scheduling','Superseded','Archived')),
  constraint audit_programs_health_chk check (configuration_health in ('Complete','Missing Scope','Missing Standards','Missing Owner','Missing Frequency','Missing Modules','Review Overdue','Needs Approval','Ready For Scheduling','Configuration Incomplete')),
  constraint audit_programs_criticality_chk check (criticality in ('Low','Medium','High','Critical','Safety-Critical','Regulatory-Critical','PSM-Critical'))
);

create unique index if not exists audit_programs_code_company_site_uidx on public.audit_programs(company_id, coalesce(site_id, ''), program_code);
create index if not exists audit_programs_company_site_status_idx on public.audit_programs(company_id, site_id, program_status);
create index if not exists audit_programs_code_idx on public.audit_programs(program_code);
create index if not exists audit_programs_type_category_idx on public.audit_programs(audit_type, program_category);
create index if not exists audit_programs_owner_idx on public.audit_programs(owner_user_id);
create index if not exists audit_programs_next_review_due_idx on public.audit_programs(next_review_due);

create table if not exists public.audit_program_scopes (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_id text not null references public.audit_programs(id) on delete cascade,
  scope_type text not null,
  site_scope_id text null references public."Site"(id) on delete set null,
  unit_id text null references public."Unit"(id) on delete set null,
  area_id text null references public."Area"(id) on delete set null,
  department_id text null,
  equipment_id text null,
  process_system text null,
  worker_role_scope text null,
  contractor_company_id text null,
  scope_description text null,
  exclusions text null,
  scope_justification text null,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz null,
  removed_by text null references public."User"(id) on delete set null,
  remove_reason text null
);

create table if not exists public.audit_program_standards (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_id text not null references public.audit_programs(id) on delete cascade,
  standard_name text not null,
  jurisdiction text null,
  clause_reference text null,
  requirement_category text null,
  applicability text null,
  mandatory boolean not null default true,
  evidence_expectation text null,
  regulatory_register_id text null,
  notes text null,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz null,
  removed_by text null references public."User"(id) on delete set null,
  remove_reason text null
);

create table if not exists public.audit_program_modules (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_id text not null references public.audit_programs(id) on delete cascade,
  module_key text not null,
  module_name text not null,
  coverage_level text not null,
  coverage_reason text null,
  evidence_source text null,
  required boolean not null default true,
  integration_enabled boolean not null default true,
  notes text null,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz null,
  removed_by text null references public."User"(id) on delete set null,
  remove_reason text null
);

create table if not exists public.audit_program_frequency_rules (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_id text not null references public.audit_programs(id) on delete cascade,
  audit_frequency text not null,
  frequency_interval text null,
  planned_start_month text null,
  next_planned_audit_date date null,
  review_frequency text null,
  next_program_review_due date null,
  audit_duration_estimate_days integer null,
  grace_period_days integer null,
  overdue_escalation_rule_json jsonb null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, program_id)
);

create table if not exists public.audit_program_integration_settings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_id text not null references public.audit_programs(id) on delete cascade,
  create_audit_plans_enabled boolean not null default true,
  checklist_builder_enabled boolean not null default true,
  generate_findings_enabled boolean not null default true,
  create_actions_for_findings_enabled boolean not null default true,
  link_evidence_from_document_control_enabled boolean not null default true,
  link_findings_to_modules_enabled boolean not null default true,
  include_in_executive_kpi boolean not null default true,
  include_in_compliance_scoring boolean not null default true,
  notification_settings_json jsonb null,
  report_settings_json jsonb null,
  settings_json jsonb null,
  updated_by text null references public."User"(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique(company_id, program_id)
);

create table if not exists public.audit_program_review_records (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_id text not null references public.audit_programs(id) on delete cascade,
  review_status text not null,
  submitted_by text null references public."User"(id) on delete set null,
  submitted_at timestamptz null,
  reviewed_by text null references public."User"(id) on delete set null,
  reviewed_at timestamptz null,
  review_comment text null,
  approval_request_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_program_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  unit_id text null references public."Unit"(id) on delete set null,
  area_id text null references public."Area"(id) on delete set null,
  program_id text null references public.audit_programs(id) on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null references public."User"(id) on delete set null,
  source_module text not null default 'Audit / Compliance Assurance',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_module_settings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  default_program_review_frequency text null,
  require_standards_for_activation boolean not null default true,
  require_scope_for_activation boolean not null default true,
  require_owner_for_activation boolean not null default true,
  require_reviewer_for_safety_critical boolean not null default true,
  require_reviewer_for_regulatory_critical boolean not null default true,
  auto_calculate_configuration_health boolean not null default true,
  auto_mark_review_overdue boolean not null default true,
  enable_review_approval_for_program_activation boolean not null default false,
  include_archived_in_dashboard boolean not null default false,
  settings_json jsonb null,
  updated_by text null references public."User"(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists audit_program_scopes_program_scope_idx on public.audit_program_scopes(program_id, scope_type) where removed_at is null;
create index if not exists audit_program_standards_program_name_idx on public.audit_program_standards(program_id, standard_name) where removed_at is null;
create index if not exists audit_program_modules_program_module_idx on public.audit_program_modules(program_id, module_key) where removed_at is null;
create index if not exists audit_program_history_events_program_created_idx on public.audit_program_history_events(program_id, created_at desc);
create index if not exists audit_program_history_events_company_created_idx on public.audit_program_history_events(company_id, created_at desc);
create unique index if not exists audit_module_settings_company_site_uidx on public.audit_module_settings(company_id, coalesce(site_id, ''));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'audit_programs',
    'audit_program_scopes',
    'audit_program_standards',
    'audit_program_modules',
    'audit_program_frequency_rules',
    'audit_program_integration_settings',
    'audit_program_review_records',
    'audit_program_history_events',
    'audit_module_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = table_name || '_tenant_policy') then
      execute format(
        'create policy %I on public.%I for all using (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''') with check (company_id = current_setting(''app.current_tenant_id'', true) or current_setting(''app.current_tenant_id'', true) = '''')',
        table_name || '_tenant_policy',
        table_name
      );
    end if;
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
  end loop;
end $$;

do $$
declare permission_item text[];
declare tenant_row record;
declare permissions text[][] := array[
  array['audit.view','View Audit / Compliance Assurance'],
  array['audit.dashboard.view','View Audit Dashboard'],
  array['audit.program.view','View Audit Programs'],
  array['audit.program.create','Create Audit Programs'],
  array['audit.program.edit','Edit Audit Programs'],
  array['audit.program.activate','Activate Audit Programs'],
  array['audit.program.archive','Archive Audit Programs'],
  array['audit.program.reactivate','Reactivate Audit Programs'],
  array['audit.program.submit_review','Submit Audit Program for Review'],
  array['audit.program.review','Review Audit Programs'],
  array['audit.program.scope.manage','Manage Audit Program Scope'],
  array['audit.program.standard.manage','Manage Audit Program Standards'],
  array['audit.program.module.manage','Manage Audit Program Modules'],
  array['audit.program.frequency.manage','Manage Audit Program Frequency'],
  array['audit.program.ownership.manage','Manage Audit Program Ownership'],
  array['audit.program.integration.manage','Manage Audit Program Integrations'],
  array['audit.history.view','View Audit Program History'],
  array['audit.settings.view','View Audit Settings'],
  array['audit.settings.edit','Edit Audit Settings']
];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_item slice 1 in array permissions loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_item[1], 'AUDIT', permission_item[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_item[1]
      );
    end loop;
  end loop;
end $$;
