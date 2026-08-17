create extension if not exists pgcrypto;

create table if not exists public.audit_plans (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null,
  program_id text null references public.audit_programs(id) on delete set null,
  plan_code text not null,
  plan_title text not null,
  description text null,
  audit_type text not null,
  plan_category text not null,
  criticality text not null,
  plan_status text not null default 'Draft',
  schedule_status text not null default 'Not Scheduled',
  readiness_health text not null default 'Missing Scope',
  conflict_status text not null default 'No Conflict',
  standalone_audit boolean not null default false,
  standalone_reason text null,
  audit_objective text null,
  audit_criteria text null,
  planned_start_at timestamptz null,
  planned_end_at timestamptz null,
  timezone text not null default 'UTC',
  audit_location text null,
  audit_mode text null,
  pre_audit_meeting_at timestamptz null,
  opening_meeting_at timestamptz null,
  closing_meeting_at timestamptz null,
  checklist_due_at timestamptz null,
  report_due_at timestamptz null,
  reminder_days_before_audit integer not null default 7 check (reminder_days_before_audit >= 0),
  grace_period_days integer not null default 0 check (grace_period_days >= 0),
  lead_auditor_user_id text null references public."User"(id) on delete set null,
  owner_user_id text null references public."User"(id) on delete set null,
  reviewer_user_id text null references public."User"(id) on delete set null,
  ready_for_checklist boolean not null default false,
  program_snapshot_json jsonb not null default '{}'::jsonb,
  notes text null,
  created_by text null references public."User"(id) on delete set null,
  updated_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scheduled_by text null references public."User"(id) on delete set null,
  scheduled_at timestamptz null,
  postponed_by text null references public."User"(id) on delete set null,
  postponed_at timestamptz null,
  postpone_reason text null,
  cancelled_by text null references public."User"(id) on delete set null,
  cancelled_at timestamptz null,
  cancel_reason text null,
  archived_by text null references public."User"(id) on delete set null,
  archived_at timestamptz null,
  archive_reason text null,
  constraint audit_plans_program_or_standalone_chk check (program_id is not null or (standalone_audit and nullif(btrim(standalone_reason), '') is not null)),
  constraint audit_plans_dates_chk check (planned_end_at is null or planned_start_at is null or planned_end_at >= planned_start_at),
  constraint audit_plans_report_due_chk check (report_due_at is null or planned_end_at is null or report_due_at >= planned_end_at)
);
create unique index if not exists audit_plans_company_site_code_uidx on public.audit_plans(company_id, coalesce(site_id, ''), plan_code);
create index if not exists audit_plans_company_site_status_idx on public.audit_plans(company_id, site_id, plan_status);
create index if not exists audit_plans_program_idx on public.audit_plans(program_id);
create index if not exists audit_plans_schedule_idx on public.audit_plans(company_id, planned_start_at, planned_end_at);
create index if not exists audit_plans_lead_schedule_idx on public.audit_plans(lead_auditor_user_id, planned_start_at, planned_end_at);

create table if not exists public.audit_plan_scopes (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, scope_type text not null, site_scope_id text null references public."Site"(id) on delete set null,
 unit_id text null references public."Unit"(id) on delete set null, area_id text null references public."Area"(id) on delete set null, department_id text null,
 equipment_id text null, process_system text null, contractor_company_id text null, worker_role_scope text null, scope_description text null, exclusions text null,
 scope_justification text null, source_from_program boolean not null default false, created_by text null references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists audit_plan_scopes_plan_type_idx on public.audit_plan_scopes(plan_id, scope_type);

create table if not exists public.audit_plan_standards (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, standard_name text not null, jurisdiction text null, clause_reference text null,
 requirement_category text null, applicability text null, mandatory boolean not null default true, evidence_expectation text null, source_from_program boolean not null default false,
 notes text null, created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists audit_plan_standards_plan_name_idx on public.audit_plan_standards(plan_id, standard_name);

create table if not exists public.audit_plan_modules (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, module_key text not null, module_name text not null, coverage_level text not null,
 coverage_reason text null, evidence_source text null, required boolean not null default true, source_from_program boolean not null default false, notes text null,
 created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists audit_plan_modules_plan_module_idx on public.audit_plan_modules(plan_id, module_key);

create table if not exists public.audit_plan_team_members (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, user_id text not null references public."User"(id) on delete restrict, team_role text not null,
 responsibility text null, required boolean not null default false, qualification_status text null, availability_status text null, notes text null,
 created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(plan_id, user_id, team_role)
);
create index if not exists audit_plan_team_plan_role_idx on public.audit_plan_team_members(plan_id, team_role);

create table if not exists public.audit_plan_schedule_events (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, event_type text not null, start_at timestamptz not null, end_at timestamptz null,
 timezone text not null default 'UTC', location text null, notes text null, created_by text null references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists audit_plan_schedule_events_plan_start_idx on public.audit_plan_schedule_events(plan_id, start_at);

create table if not exists public.audit_plan_readiness_checks (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, check_key text not null, check_label text not null, check_status text not null,
 blocking boolean not null default false, reason text null, evaluated_at timestamptz not null default now(), metadata_json jsonb not null default '{}'::jsonb,
 unique(plan_id, check_key)
);

create table if not exists public.audit_plan_conflicts (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, conflict_type text not null, conflict_status text not null, severity text not null,
 title text not null, description text null, related_record_type text null, related_record_id text null, detected_at timestamptz not null default now(),
 resolved_by text null references public."User"(id) on delete set null, resolved_at timestamptz null, resolution_reason text null, override_approved boolean not null default false,
 metadata_json jsonb not null default '{}'::jsonb
);
create index if not exists audit_plan_conflicts_plan_status_idx on public.audit_plan_conflicts(plan_id, conflict_status);

create table if not exists public.audit_plan_generation_jobs (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 program_id text not null references public.audit_programs(id) on delete cascade, job_status text not null default 'Pending', target_period text null,
 request_json jsonb not null default '{}'::jsonb, result_json jsonb not null default '{}'::jsonb, error_message text null,
 created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(), completed_at timestamptz null
);

create table if not exists public.audit_plan_review_records (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 plan_id text not null references public.audit_plans(id) on delete cascade, review_status text not null, submitted_by text null references public."User"(id) on delete set null,
 submitted_at timestamptz null, reviewed_by text null references public."User"(id) on delete set null, reviewed_at timestamptz null, review_comment text null,
 approval_request_id text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.audit_plan_history_events (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 unit_id text null references public."Unit"(id) on delete set null, area_id text null references public."Area"(id) on delete set null,
 plan_id text null references public.audit_plans(id) on delete cascade, event_type text not null, event_title text not null, event_description text null,
 before_value_json jsonb null, after_value_json jsonb null, actor_user_id text null references public."User"(id) on delete set null,
 source_module text not null default 'Audit Plan / Schedule', source_record_id text null, created_at timestamptz not null default now()
);
create index if not exists audit_plan_history_plan_created_idx on public.audit_plan_history_events(plan_id, created_at desc);

create table if not exists public.audit_plan_settings (
 id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
 allow_standalone_audits boolean not null default true, require_scope_for_schedule boolean not null default true, require_standards_for_schedule boolean not null default true,
 require_modules_for_schedule boolean not null default true, require_lead_auditor_for_schedule boolean not null default true, require_team_for_safety_critical boolean not null default true,
 hard_conflicts_block_schedule boolean not null default true, require_approval_before_checklist boolean not null default false, due_soon_days integer not null default 14,
 settings_json jsonb not null default '{}'::jsonb, updated_by text null references public."User"(id) on delete set null, updated_at timestamptz not null default now()
);
create unique index if not exists audit_plan_settings_company_site_uidx on public.audit_plan_settings(company_id, coalesce(site_id, ''));

do $$
declare table_name text;
begin
 foreach table_name in array array['audit_plans','audit_plan_scopes','audit_plan_standards','audit_plan_modules','audit_plan_team_members','audit_plan_schedule_events','audit_plan_readiness_checks','audit_plan_conflicts','audit_plan_generation_jobs','audit_plan_review_records','audit_plan_history_events','audit_plan_settings'] loop
  execute format('alter table public.%I alter column id set default gen_random_uuid()::text', table_name);
  execute format('alter table public.%I enable row level security', table_name);
  if not exists (select 1 from pg_policies where schemaname='public' and tablename=table_name and policyname=table_name||'_tenant_policy') then
   execute format(
     'create policy %I on public.%I for all to authenticated
      using (
        company_id = coalesce(
          nullif(current_setting(''app.current_tenant_id'', true), ''''),
          auth.jwt()->''app_metadata''->>''tenantId'',
          auth.jwt()->''app_metadata''->>''tenant_id''
        )
        and (
          site_id is null
          or site_id = nullif(current_setting(''app.current_site_id'', true), '''')
          or coalesce(auth.jwt()->''app_metadata''->''siteIds'', auth.jwt()->''app_metadata''->''site_ids'', ''[]''::jsonb) ? site_id
          or coalesce(auth.jwt()->''app_metadata''->>''corporateView'', auth.jwt()->''app_metadata''->>''corporate_view'', ''false'') = ''true''
          or coalesce(auth.jwt()->''app_metadata''->>''isCompanyAdmin'', auth.jwt()->''app_metadata''->>''is_company_admin'', ''false'') = ''true''
        )
      )
      with check (
        company_id = coalesce(
          nullif(current_setting(''app.current_tenant_id'', true), ''''),
          auth.jwt()->''app_metadata''->>''tenantId'',
          auth.jwt()->''app_metadata''->>''tenant_id''
        )
        and (
          site_id is null
          or site_id = nullif(current_setting(''app.current_site_id'', true), '''')
          or coalesce(auth.jwt()->''app_metadata''->''siteIds'', auth.jwt()->''app_metadata''->''site_ids'', ''[]''::jsonb) ? site_id
          or coalesce(auth.jwt()->''app_metadata''->>''corporateView'', auth.jwt()->''app_metadata''->>''corporate_view'', ''false'') = ''true''
          or coalesce(auth.jwt()->''app_metadata''->>''isCompanyAdmin'', auth.jwt()->''app_metadata''->>''is_company_admin'', ''false'') = ''true''
        )
      )',
     table_name||'_tenant_policy', table_name
   );
  end if;
  execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
 end loop;
end $$;

do $$
declare permission_item text[]; tenant_row record;
declare permissions text[][] := array[
 array['audit.plan.view','View Audit Plans'],array['audit.plan.dashboard.view','View Audit Plan Dashboard'],array['audit.plan.calendar.view','View Audit Plan Calendar'],
 array['audit.plan.create','Create Audit Plans'],array['audit.plan.edit','Edit Audit Plans'],array['audit.plan.schedule','Schedule Audit Plans'],
 array['audit.plan.reschedule','Reschedule Audit Plans'],array['audit.plan.postpone','Postpone Audit Plans'],array['audit.plan.cancel','Cancel Audit Plans'],
 array['audit.plan.archive','Archive Audit Plans'],array['audit.plan.reactivate','Reactivate Audit Plans'],array['audit.plan.generate_from_program','Generate Plans From Programs'],
 array['audit.plan.submit_review','Submit Audit Plans for Review'],array['audit.plan.review','Review Audit Plans'],array['audit.plan.scope.manage','Manage Audit Plan Scope'],
 array['audit.plan.standard.manage','Manage Audit Plan Standards'],array['audit.plan.module.manage','Manage Audit Plan Modules'],array['audit.plan.team.manage','Manage Audit Plan Team'],
 array['audit.plan.conflict.view','View Audit Plan Conflicts'],array['audit.plan.conflict.override','Override Audit Plan Conflicts'],array['audit.plan.readiness.run','Run Audit Plan Readiness'],
 array['audit.plan.history.view','View Audit Plan History'],array['audit.plan.settings.view','View Audit Plan Settings'],array['audit.plan.settings.edit','Edit Audit Plan Settings']
 ];
begin
 for tenant_row in select id from public."Tenant" loop
  foreach permission_item slice 1 in array permissions loop
   insert into public."Permission" ("id","tenantId","key","moduleKey","label")
   select gen_random_uuid()::text,tenant_row.id,permission_item[1],'AUDIT',permission_item[2]
   where not exists(select 1 from public."Permission" where "tenantId"=tenant_row.id and "key"=permission_item[1]);
  end loop;
 end loop;
end $$;
