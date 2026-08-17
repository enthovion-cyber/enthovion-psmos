create extension if not exists pgcrypto;

create table if not exists public.audit_checklist_templates (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_code text not null, checklist_title text not null,
 description text null, template_type text not null, audit_type text not null, checklist_category text null, criticality text not null,
 checklist_status text not null default 'Draft', readiness_health text not null default 'Missing Sections', version text not null default '1.0',
 current_version boolean not null default false, effective_date date null, checklist_objective text null,
 owner_user_id text null references public."User"(id) on delete set null, reviewer_user_id text null references public."User"(id) on delete set null,
 approval_owner_user_id text null references public."User"(id) on delete set null, next_review_due date null, review_frequency text null,
 supersedes_checklist_id text null references public.audit_checklist_templates(id) on delete set null,
 source_program_id text null references public.audit_programs(id) on delete set null, source_plan_id text null references public.audit_plans(id) on delete set null,
 standalone_checklist boolean not null default false, standalone_reason text null, source_snapshot_json jsonb null,
 evidence_response_rules_json jsonb not null default '{}'::jsonb, version_notes text null, governance_notes text null,
 ready_for_execution boolean not null default false, source_changed boolean not null default false,
 created_by text null references public."User"(id) on delete set null, updated_by text null references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 activated_by text null references public."User"(id) on delete set null, activated_at timestamptz null,
 archived_at timestamptz null, archived_by text null references public."User"(id) on delete set null, archive_reason text null,
 constraint audit_checklist_template_company_code_version_uidx unique(company_id, site_id, checklist_code, version)
);

create table if not exists public.audit_checklist_scopes (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 scope_type text not null, site_scope_id text null references public."Site"(id) on delete set null, unit_id text null references public."Unit"(id) on delete set null,
 area_id text null references public."Area"(id) on delete set null, department_id text null, equipment_id text null, process_system text null,
 worker_role_scope text null, contractor_company_id text null, applicability_description text null, exclusions text null,
 applicability_justification text null, source_from_program boolean not null default false, source_from_plan boolean not null default false,
 created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 removed_at timestamptz null, removed_by text null references public."User"(id) on delete set null, remove_reason text null
);

create unique index if not exists audit_checklist_template_company_site_code_version_uidx
 on public.audit_checklist_templates(company_id, coalesce(site_id, ''), checklist_code, version);

create table if not exists public.audit_checklist_standards (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 program_standard_id text null, plan_standard_id text null, standard_name text not null, jurisdiction text null, clause_reference text null,
 requirement_category text null, applicability text null, mandatory boolean not null default true, evidence_expectation text null,
 regulatory_register_id text null, source_from_program boolean not null default false, source_from_plan boolean not null default false, notes text null,
 created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 removed_at timestamptz null, removed_by text null references public."User"(id) on delete set null, remove_reason text null
);

create table if not exists public.audit_checklist_modules (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 program_module_id text null, plan_module_id text null, module_key text not null, module_name text not null, coverage_level text not null,
 coverage_reason text null, evidence_source text null, required boolean not null default true, integration_enabled boolean not null default true,
 source_from_program boolean not null default false, source_from_plan boolean not null default false, notes text null,
 created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 removed_at timestamptz null, removed_by text null references public."User"(id) on delete set null, remove_reason text null,
 constraint audit_checklist_modules_uidx unique(checklist_id, module_key)
);

create table if not exists public.audit_checklist_sections (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 section_code text not null, section_title text not null, section_description text null, section_order integer not null,
 section_criticality text null, standard_id text null references public.audit_checklist_standards(id) on delete set null,
 module_id text null references public.audit_checklist_modules(id) on delete set null, mandatory boolean not null default true, notes text null,
 created_by text null references public."User"(id) on delete set null, updated_by text null references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), removed_at timestamptz null,
 removed_by text null references public."User"(id) on delete set null, remove_reason text null,
 constraint audit_checklist_sections_code_uidx unique(checklist_id, section_code), constraint audit_checklist_sections_order_check check(section_order > 0)
);

create table if not exists public.audit_checklist_items (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 section_id text not null references public.audit_checklist_sections(id) on delete cascade, item_code text not null, item_text text not null,
 item_order integer not null, question_type text not null, response_type text not null, required_response boolean not null default true,
 mandatory_evidence boolean not null default false, may_create_finding boolean not null default true, safety_critical boolean not null default false,
 regulatory_critical boolean not null default false, psm_critical boolean not null default false, severity_foundation text null,
 expected_evidence text null, guidance_text text null, standard_id text null references public.audit_checklist_standards(id) on delete set null,
 module_id text null references public.audit_checklist_modules(id) on delete set null, applicability_condition_json jsonb null,
 not_applicable_allowed boolean not null default true, comments_required boolean not null default false,
 attachments_allowed boolean not null default true, attachments_required boolean not null default false,
 future_scoring_weight numeric null, notes text null, question_bank_id text null,
 created_by text null references public."User"(id) on delete set null, updated_by text null references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), removed_at timestamptz null,
 removed_by text null references public."User"(id) on delete set null, remove_reason text null,
 constraint audit_checklist_items_code_uidx unique(checklist_id, item_code), constraint audit_checklist_items_order_check check(item_order > 0),
 constraint audit_checklist_items_attachment_check check(not attachments_required or attachments_allowed)
);

create table if not exists public.audit_question_bank (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, question_code text not null, question_text text not null,
 question_type text not null, response_type text not null, category text null, standard_name text null, jurisdiction text null,
 clause_reference text null, module_key text null, evidence_expectation text null, criticality text null, default_severity text null,
 default_guidance text null, default_response_rules_json jsonb null, owner_user_id text null references public."User"(id) on delete set null,
 question_status text not null default 'Draft', version text not null default '1.0', tags_json jsonb null,
 supersedes_question_id text null references public.audit_question_bank(id) on delete set null,
 created_by text null references public."User"(id) on delete set null, updated_by text null references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz null,
 archived_by text null references public."User"(id) on delete set null, archive_reason text null,
 constraint audit_question_bank_code_version_uidx unique(company_id, site_id, question_code, version)
);
alter table public.audit_checklist_items drop constraint if exists audit_checklist_items_question_bank_id_fkey;
create unique index if not exists audit_question_bank_company_site_code_version_uidx
 on public.audit_question_bank(company_id, coalesce(site_id, ''), question_code, version);
alter table public.audit_checklist_items add constraint audit_checklist_items_question_bank_id_fkey foreign key(question_bank_id) references public.audit_question_bank(id) on delete set null;

create table if not exists public.audit_checklist_assignments (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 program_id text null references public.audit_programs(id) on delete cascade, plan_id text null references public.audit_plans(id) on delete cascade,
 checklist_version text not null, primary_checklist boolean not null default true, supplemental_checklist boolean not null default false,
 assignment_reason text null, readiness_status text null, alignment_warnings_json jsonb null,
 assigned_by text null references public."User"(id) on delete set null, assigned_at timestamptz not null default now(),
 removed_by text null references public."User"(id) on delete set null, removed_at timestamptz null, remove_reason text null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint audit_checklist_assignment_target_check check(program_id is not null or plan_id is not null)
);
create unique index if not exists audit_checklist_primary_plan_uidx on public.audit_checklist_assignments(plan_id) where primary_checklist and removed_at is null;

create table if not exists public.audit_checklist_readiness_checks (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 readiness_status text not null, has_scope boolean not null default false, has_standards boolean not null default false,
 has_modules boolean not null default false, has_sections boolean not null default false, has_items boolean not null default false,
 has_owner boolean not null default false, has_review_due boolean not null default false, approval_complete boolean not null default false,
 ready_for_execution boolean not null default false, missing_items_json jsonb null, warnings_json jsonb null,
 checked_by text null references public."User"(id) on delete set null, checked_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.audit_checklist_version_records (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 version text not null, version_status text not null, version_notes text null, change_reason text null,
 created_from_checklist_id text null references public.audit_checklist_templates(id) on delete set null,
 created_by text null references public."User"(id) on delete set null, created_at timestamptz not null default now(),
 approved_by text null references public."User"(id) on delete set null, approved_at timestamptz null, superseded_at timestamptz null
);

create table if not exists public.audit_checklist_review_records (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, checklist_id text not null references public.audit_checklist_templates(id) on delete cascade,
 review_status text not null, submitted_by text null references public."User"(id) on delete set null, submitted_at timestamptz null,
 reviewed_by text null references public."User"(id) on delete set null, reviewed_at timestamptz null, review_comment text null,
 approval_request_id text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.audit_checklist_history_events (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, unit_id text null references public."Unit"(id) on delete set null,
 area_id text null references public."Area"(id) on delete set null, checklist_id text null references public.audit_checklist_templates(id) on delete cascade,
 section_id text null references public.audit_checklist_sections(id) on delete set null, item_id text null references public.audit_checklist_items(id) on delete set null,
 question_bank_id text null references public.audit_question_bank(id) on delete set null, program_id text null references public.audit_programs(id) on delete set null,
 plan_id text null references public.audit_plans(id) on delete set null, event_type text not null, event_title text not null,
 event_description text null, before_value_json jsonb null, after_value_json jsonb null,
 actor_user_id text null references public."User"(id) on delete set null, source_module text not null default 'Audit Checklist Builder',
 source_record_id text null, created_at timestamptz not null default now()
);

create table if not exists public.audit_checklist_settings (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text null references public."Site"(id) on delete set null, require_scope_for_activation boolean not null default true,
 require_standards_for_activation boolean not null default true, require_modules_for_activation boolean not null default true,
 require_sections_for_activation boolean not null default true, require_items_for_activation boolean not null default true,
 require_owner_for_activation boolean not null default true, require_reviewer_for_safety_critical boolean not null default true,
 require_reviewer_for_regulatory_critical boolean not null default true, require_review_due_for_activation boolean not null default true,
 require_review_approval_for_activation boolean not null default false, lock_approved_checklists boolean not null default true,
 allow_draft_checklist_assignment boolean not null default false, allow_question_bank boolean not null default true,
 auto_calculate_readiness boolean not null default true, auto_mark_review_overdue boolean not null default true,
 settings_json jsonb null, updated_by text null references public."User"(id) on delete set null, updated_at timestamptz not null default now()
);
create unique index if not exists audit_checklist_settings_company_site_uidx on public.audit_checklist_settings(company_id, coalesce(site_id,''));

create index if not exists audit_checklist_templates_scope_status_idx on public.audit_checklist_templates(company_id,site_id,checklist_status);
create index if not exists audit_checklist_templates_type_idx on public.audit_checklist_templates(audit_type,template_type);
create index if not exists audit_checklist_templates_program_idx on public.audit_checklist_templates(source_program_id);
create index if not exists audit_checklist_templates_plan_idx on public.audit_checklist_templates(source_plan_id);
create index if not exists audit_checklist_sections_order_idx on public.audit_checklist_sections(checklist_id,section_order) where removed_at is null;
create index if not exists audit_checklist_items_order_idx on public.audit_checklist_items(checklist_id,section_id,item_order) where removed_at is null;
create index if not exists audit_checklist_items_bank_idx on public.audit_checklist_items(question_bank_id);
create index if not exists audit_question_bank_status_idx on public.audit_question_bank(company_id,site_id,question_status);
create index if not exists audit_checklist_assignments_target_idx on public.audit_checklist_assignments(plan_id,checklist_id) where removed_at is null;
create index if not exists audit_checklist_history_created_idx on public.audit_checklist_history_events(checklist_id,created_at desc);

do $$ declare t text; begin
 foreach t in array array['audit_checklist_templates','audit_checklist_scopes','audit_checklist_standards','audit_checklist_modules','audit_checklist_sections','audit_checklist_items','audit_question_bank','audit_checklist_assignments','audit_checklist_readiness_checks','audit_checklist_version_records','audit_checklist_review_records','audit_checklist_history_events','audit_checklist_settings'] loop
  execute format('alter table public.%I enable row level security',t);
  if not exists(select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t||'_tenant_site_policy') then
   execute format('create policy %I on public.%I for all to authenticated using (
    company_id=coalesce(nullif(current_setting(''app.current_tenant_id'',true),''''),auth.jwt()->''app_metadata''->>''tenantId'',auth.jwt()->''app_metadata''->>''tenant_id'')
    and (site_id is null or site_id=nullif(current_setting(''app.current_site_id'',true),'''') or coalesce(auth.jwt()->''app_metadata''->''siteIds'',auth.jwt()->''app_metadata''->''site_ids'',''[]''::jsonb) ? site_id or coalesce(auth.jwt()->''app_metadata''->>''corporateView'',auth.jwt()->''app_metadata''->>''corporate_view'',''false'')=''true'' or coalesce(auth.jwt()->''app_metadata''->>''isCompanyAdmin'',auth.jwt()->''app_metadata''->>''is_company_admin'',''false'')=''true'')) with check (
    company_id=coalesce(nullif(current_setting(''app.current_tenant_id'',true),''''),auth.jwt()->''app_metadata''->>''tenantId'',auth.jwt()->''app_metadata''->>''tenant_id'')
    and (site_id is null or site_id=nullif(current_setting(''app.current_site_id'',true),'''') or coalesce(auth.jwt()->''app_metadata''->''siteIds'',auth.jwt()->''app_metadata''->''site_ids'',''[]''::jsonb) ? site_id or coalesce(auth.jwt()->''app_metadata''->>''corporateView'',auth.jwt()->''app_metadata''->>''corporate_view'',''false'')=''true'' or coalesce(auth.jwt()->''app_metadata''->>''isCompanyAdmin'',auth.jwt()->''app_metadata''->>''is_company_admin'',''false'')=''true''))',t||'_tenant_site_policy',t);
  end if;
 end loop;
end $$;

do $$ declare p text[]; tenant_row record; permissions text[][] := array[
 ['audit.checklist.view','View audit checklists'],['audit.checklist.dashboard.view','View checklist dashboard'],['audit.checklist.template.view','View checklist templates'],
 ['audit.checklist.template.create','Create checklist templates'],['audit.checklist.template.edit','Edit checklist templates'],['audit.checklist.template.activate','Activate checklist templates'],
 ['audit.checklist.template.archive','Archive checklist templates'],['audit.checklist.template.reactivate','Reactivate checklist templates'],['audit.checklist.template.version.create','Create checklist versions'],
 ['audit.checklist.submit_review','Submit checklist review'],['audit.checklist.review','Review checklists'],['audit.checklist.section.manage','Manage checklist sections'],
 ['audit.checklist.item.manage','Manage checklist items'],['audit.checklist.standard.manage','Manage checklist standards'],['audit.checklist.module.manage','Manage checklist modules'],
 ['audit.checklist.scope.manage','Manage checklist scope'],['audit.checklist.assignment.view','View checklist assignments'],['audit.checklist.assignment.manage','Manage checklist assignments'],
 ['audit.checklist.question_bank.view','View question bank'],['audit.checklist.question_bank.create','Create question bank items'],['audit.checklist.question_bank.edit','Edit question bank items'],
 ['audit.checklist.question_bank.archive','Archive question bank items'],['audit.checklist.readiness.run','Run checklist readiness'],['audit.checklist.history.view','View checklist history'],
 ['audit.checklist.settings.view','View checklist settings'],['audit.checklist.settings.edit','Edit checklist settings']
 ]; begin
 for tenant_row in select id from public."Tenant" loop foreach p slice 1 in array permissions loop
  insert into public."Permission"("id","tenantId","key","moduleKey","label") select gen_random_uuid()::text,tenant_row.id,p[1],'AUDIT',p[2]
  where not exists(select 1 from public."Permission" where "tenantId"=tenant_row.id and "key"=p[1]);
 end loop; end loop;
end $$;
