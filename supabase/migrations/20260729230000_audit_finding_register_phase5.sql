create extension if not exists pgcrypto;

create table if not exists public.audit_findings (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 equipment_id text,
 program_id text references public.audit_programs(id) on delete set null,
 plan_id text references public.audit_plans(id) on delete set null,
 execution_id text references public.audit_executions(id) on delete set null,
 checklist_id text references public.audit_checklist_templates(id) on delete set null,
 finding_code text not null,
 finding_title text not null,
 finding_description text,
 finding_type text not null default 'Observation',
 finding_status text not null default 'Draft',
 review_status text default 'Not Required',
 capa_readiness_status text not null default 'Not Ready',
 evidence_status text not null default 'Not Required',
 duplicate_repeat_status text not null default 'Not Checked',
 severity text,
 priority text,
 risk_potential text,
 criticality text not null default 'Medium',
 safety_critical boolean not null default false,
 regulatory_critical boolean not null default false,
 psm_critical boolean not null default false,
 immediate_concern boolean not null default false,
 stop_work_recommended boolean not null default false,
 repeat_finding boolean not null default false,
 recurrence_category text,
 classification_rationale text,
 owner_user_id text references public."User"(id) on delete set null,
 reviewer_user_id text references public."User"(id) on delete set null,
 responsible_department_id text,
 escalation_owner_user_id text references public."User"(id) on delete set null,
 due_date date,
 due_date_basis text,
 target_closure_date date,
 sla_category text,
 capa_required boolean not null default false,
 capa_required_reason text,
 suggested_corrective_action text,
 suggested_preventive_action text,
 immediate_containment_needed boolean not null default false,
 action_owner_recommendation text,
 action_due_date_recommendation date,
 verification_required_foundation boolean not null default false,
 effectiveness_check_required_foundation boolean not null default false,
 ready_for_capa boolean not null default false,
 capa_record_id text,
 source_snapshot_json jsonb,
 created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 confirmed_by text references public."User"(id) on delete set null,
 confirmed_at timestamptz,
 rejected_by text references public."User"(id) on delete set null,
 rejected_at timestamptz,
 rejection_reason text,
 reopened_by text references public."User"(id) on delete set null,
 reopened_at timestamptz,
 reopen_reason text,
 archived_at timestamptz,
 archived_by text references public."User"(id) on delete set null,
 archive_reason text
);

create unique index if not exists audit_findings_company_site_code_uidx on public.audit_findings(company_id, coalesce(site_id,''), finding_code);
create index if not exists audit_findings_status_idx on public.audit_findings(company_id, site_id, finding_status);
create index if not exists audit_findings_program_idx on public.audit_findings(program_id);
create index if not exists audit_findings_plan_idx on public.audit_findings(plan_id);
create index if not exists audit_findings_execution_idx on public.audit_findings(execution_id);
create index if not exists audit_findings_code_idx on public.audit_findings(finding_code);
create index if not exists audit_findings_owner_idx on public.audit_findings(owner_user_id);
create index if not exists audit_findings_due_date_idx on public.audit_findings(due_date);
create index if not exists audit_findings_severity_idx on public.audit_findings(severity, criticality);
create index if not exists audit_findings_ready_capa_idx on public.audit_findings(ready_for_capa);

create table if not exists public.audit_finding_sources (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 source_type text not null,
 source_module text not null,
 source_record_id text,
 execution_id text references public.audit_executions(id) on delete set null,
 execution_section_id text references public.audit_execution_sections(id) on delete set null,
 execution_item_id text references public.audit_execution_items(id) on delete set null,
 response_id text references public.audit_execution_responses(id) on delete set null,
 field_finding_id text references public.audit_field_findings(id) on delete set null,
 field_note_id text references public.audit_field_notes(id) on delete set null,
 evidence_id text,
 interview_id text references public.audit_execution_interviews(id) on delete set null,
 walkthrough_id text references public.audit_execution_walkthroughs(id) on delete set null,
 source_description text,
 manual_source_reason text,
 source_snapshot_json jsonb,
 primary_source boolean not null default true,
 linked_by text references public."User"(id) on delete set null,
 linked_at timestamptz not null default now(),
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text
);
create index if not exists audit_finding_sources_finding_type_idx on public.audit_finding_sources(finding_id, source_type);
create index if not exists audit_finding_sources_field_finding_idx on public.audit_finding_sources(field_finding_id);

create table if not exists public.audit_finding_standard_links (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 standard_name text not null,
 jurisdiction text,
 clause_reference text,
 requirement_category text,
 compliance_obligation text,
 evidence_expectation text,
 regulatory_register_id text,
 checklist_standard_id text,
 source_from_checklist boolean not null default false,
 notes text,
 created_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text
);
create index if not exists audit_finding_standard_links_finding_idx on public.audit_finding_standard_links(finding_id, standard_name);

create table if not exists public.audit_finding_module_links (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 module_key text not null,
 module_name text not null,
 related_record_id text,
 related_record_title text,
 relationship_type text not null default 'Finding affects module',
 impact_description text,
 integration_status text,
 created_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text
);
create index if not exists audit_finding_module_links_finding_idx on public.audit_finding_module_links(finding_id, module_key);

create table if not exists public.audit_finding_evidence_links (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 evidence_title text not null,
 evidence_type text not null,
 evidence_description text,
 document_id text,
 storage_file_id text,
 execution_evidence_id text references public.audit_execution_evidence_links(id) on delete set null,
 related_module text,
 related_record_id text,
 confidentiality_level text,
 evidence_status text not null default 'Linked',
 uploaded_by text references public."User"(id) on delete set null,
 linked_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text
);
create index if not exists audit_finding_evidence_links_finding_idx on public.audit_finding_evidence_links(finding_id);

create table if not exists public.audit_finding_ownership_records (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 owner_user_id text not null references public."User"(id) on delete restrict,
 ownership_role text not null default 'Owner',
 assigned_by text references public."User"(id) on delete set null,
 assigned_at timestamptz not null default now(),
 assignment_reason text,
 due_date date,
 status text not null default 'Active',
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists audit_finding_ownership_finding_idx on public.audit_finding_ownership_records(finding_id, status);

create table if not exists public.audit_finding_review_records (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 review_status text not null default 'Pending Review',
 submitted_by text references public."User"(id) on delete set null,
 submitted_at timestamptz,
 reviewed_by text references public."User"(id) on delete set null,
 reviewed_at timestamptz,
 review_decision text,
 review_comment text,
 approval_request_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_finding_duplicate_checks (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 check_status text not null,
 duplicate_repeat_status text not null,
 matched_finding_ids_json jsonb,
 match_reasons_json jsonb,
 user_decision text,
 user_decision_reason text,
 checked_by text references public."User"(id) on delete set null,
 checked_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_finding_capa_foundation_links (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 capa_required boolean not null default false,
 capa_readiness_status text not null default 'Not Ready',
 action_engine_record_id text,
 capa_record_id text,
 suggested_corrective_action text,
 suggested_preventive_action text,
 immediate_containment_needed boolean not null default false,
 verification_required_foundation boolean not null default false,
 effectiveness_check_required_foundation boolean not null default false,
 link_status text not null default 'Foundation',
 created_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_finding_status_transitions (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 finding_id text not null references public.audit_findings(id) on delete cascade,
 from_status text,
 to_status text not null,
 transition_reason text,
 transitioned_by text references public."User"(id) on delete set null,
 transitioned_at timestamptz not null default now(),
 validation_result_json jsonb,
 created_at timestamptz not null default now()
);

create table if not exists public.audit_finding_history_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 program_id text,
 plan_id text,
 execution_id text,
 finding_id text references public.audit_findings(id) on delete set null,
 field_finding_id text,
 event_type text not null,
 event_title text not null,
 event_description text,
 before_value_json jsonb,
 after_value_json jsonb,
 actor_user_id text references public."User"(id) on delete set null,
 source_module text not null default 'Audit Finding Register',
 source_record_id text,
 created_at timestamptz not null default now()
);
create index if not exists audit_finding_history_events_idx on public.audit_finding_history_events(finding_id, created_at desc);

create table if not exists public.audit_finding_settings (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete cascade,
 require_source_for_finding boolean not null default true,
 allow_manual_findings boolean not null default true,
 require_manual_source_reason boolean not null default true,
 require_classification_for_confirmation boolean not null default true,
 require_owner_for_ready_capa boolean not null default true,
 require_due_date_for_ready_capa boolean not null default true,
 require_evidence_for_confirmation boolean not null default false,
 require_review_for_safety_critical boolean not null default true,
 require_review_for_regulatory_critical boolean not null default true,
 require_review_for_psm_critical boolean not null default true,
 auto_check_duplicates boolean not null default true,
 duplicate_check_window_days integer not null default 730,
 block_confirmation_on_potential_duplicate boolean not null default false,
 auto_mark_overdue boolean not null default true,
 auto_notify_owner_on_assignment boolean not null default true,
 auto_notify_lead_on_safety_critical boolean not null default true,
 auto_create_capa_foundation_for_confirmed boolean not null default false,
 settings_json jsonb,
 updated_by text references public."User"(id) on delete set null,
 updated_at timestamptz not null default now()
);
create unique index if not exists audit_finding_settings_scope_uidx on public.audit_finding_settings(company_id, coalesce(site_id,''));

do $$ declare t text; begin
 foreach t in array array[
  'audit_findings','audit_finding_sources','audit_finding_standard_links','audit_finding_module_links','audit_finding_evidence_links',
  'audit_finding_ownership_records','audit_finding_review_records','audit_finding_duplicate_checks','audit_finding_capa_foundation_links',
  'audit_finding_status_transitions','audit_finding_history_events','audit_finding_settings'
 ] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('drop policy if exists %I on public.%I', t || '_tenant_site_policy', t);
  execute format($p$create policy %I on public.%I for all to authenticated using (
    company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt()->'app_metadata'->>'tenantId', auth.jwt()->'app_metadata'->>'tenant_id')
    and (
      site_id is null
      or site_id = nullif(current_setting('app.current_site_id', true), '')
      or coalesce(auth.jwt()->'app_metadata'->'siteIds', auth.jwt()->'app_metadata'->'site_ids', '[]'::jsonb) ? site_id
      or coalesce(auth.jwt()->'app_metadata'->>'corporateView', auth.jwt()->'app_metadata'->>'corporate_view', 'false') = 'true'
      or coalesce(auth.jwt()->'app_metadata'->>'isCompanyAdmin', auth.jwt()->'app_metadata'->>'is_company_admin', 'false') = 'true'
      or coalesce(auth.jwt()->'app_metadata'->>'isSuperAdmin', auth.jwt()->'app_metadata'->>'is_super_admin', 'false') = 'true'
    )
  ) with check (
    company_id = coalesce(nullif(current_setting('app.current_tenant_id', true), ''), auth.jwt()->'app_metadata'->>'tenantId', auth.jwt()->'app_metadata'->>'tenant_id')
    and (
      site_id is null
      or site_id = nullif(current_setting('app.current_site_id', true), '')
      or coalesce(auth.jwt()->'app_metadata'->'siteIds', auth.jwt()->'app_metadata'->'site_ids', '[]'::jsonb) ? site_id
      or coalesce(auth.jwt()->'app_metadata'->>'corporateView', auth.jwt()->'app_metadata'->>'corporate_view', 'false') = 'true'
      or coalesce(auth.jwt()->'app_metadata'->>'isCompanyAdmin', auth.jwt()->'app_metadata'->>'is_company_admin', 'false') = 'true'
      or coalesce(auth.jwt()->'app_metadata'->>'isSuperAdmin', auth.jwt()->'app_metadata'->>'is_super_admin', 'false') = 'true'
    )
  )$p$, t || '_tenant_site_policy', t);
  execute format('grant select, insert, update, delete on public.%I to authenticated', t);
 end loop;
end $$;

do $$ declare tenant_id text; p text; begin
 foreach tenant_id in array(select id from public."Tenant") loop
  foreach p in array array[
   'audit.finding.view','audit.finding.dashboard.view','audit.finding.register.view','audit.finding.create','audit.finding.edit',
   'audit.finding.classify','audit.finding.confirm','audit.finding.reject','audit.finding.reopen','audit.finding.archive',
   'audit.finding.convert_from_field','audit.finding.source.manage','audit.finding.standard.manage','audit.finding.module.manage',
   'audit.finding.evidence.view','audit.finding.evidence.add','audit.finding.evidence.remove','audit.finding.owner.assign',
   'audit.finding.review.submit','audit.finding.review.perform','audit.finding.duplicate.check','audit.finding.duplicate.override',
   'audit.finding.capa_foundation.view','audit.finding.capa_foundation.create','audit.finding.history.view',
   'audit.finding.settings.view','audit.finding.settings.edit'
  ] loop
   insert into public."Permission"("id","tenantId","key","moduleKey","label")
   select gen_random_uuid()::text, tenant_id, p, 'AUDIT', initcap(replace(p, '.', ' '))
   where not exists(select 1 from public."Permission" where "tenantId" = tenant_id and "key" = p);
  end loop;
 end loop;
end $$;
