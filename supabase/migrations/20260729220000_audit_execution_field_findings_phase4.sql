create extension if not exists pgcrypto;

create table if not exists public.audit_executions (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null, unit_id text references public."Unit"(id) on delete set null, area_id text references public."Area"(id) on delete set null,
 program_id text references public.audit_programs(id) on delete set null, plan_id text references public.audit_plans(id) on delete restrict,
 checklist_id text references public.audit_checklist_templates(id) on delete restrict, execution_code text not null, execution_title text not null,
 execution_status text not null default 'Draft', progress_status text not null default 'Not Started', evidence_status text not null default 'Not Required',
 field_finding_status text, audit_type text, criticality text, execution_mode text not null, lead_auditor_user_id text references public."User"(id) on delete set null,
 started_by text references public."User"(id) on delete set null, started_at timestamptz, paused_by text references public."User"(id) on delete set null,
 paused_at timestamptz, pause_reason text, resumed_by text references public."User"(id) on delete set null, resumed_at timestamptz,
 completed_by text references public."User"(id) on delete set null, completed_at timestamptz, completion_notes text,
 reopened_by text references public."User"(id) on delete set null, reopened_at timestamptz, reopen_reason text,
 cancelled_by text references public."User"(id) on delete set null, cancelled_at timestamptz, cancel_reason text,
 plan_snapshot_json jsonb not null, checklist_snapshot_json jsonb not null, scope_snapshot_json jsonb, team_snapshot_json jsonb,
 progress_percent numeric not null default 0, total_items integer not null default 0, completed_items integer not null default 0,
 pending_items integer not null default 0, non_compliant_items integer not null default 0, evidence_required_count integer not null default 0,
 evidence_missing_count integer not null default 0, field_findings_count integer not null default 0, critical_findings_count integer not null default 0,
 ready_for_finding_register boolean not null default false, created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 archived_at timestamptz, archived_by text references public."User"(id) on delete set null, archive_reason text
);
create unique index if not exists audit_execution_company_site_code_uidx on public.audit_executions(company_id,coalesce(site_id,''),execution_code);
create index if not exists audit_executions_status_idx on public.audit_executions(company_id,site_id,execution_status);
create index if not exists audit_executions_plan_idx on public.audit_executions(plan_id);
create index if not exists audit_executions_checklist_idx on public.audit_executions(checklist_id);
create index if not exists audit_executions_lead_idx on public.audit_executions(lead_auditor_user_id);

create table if not exists public.audit_execution_sections (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 execution_id text not null references public.audit_executions(id) on delete cascade, checklist_section_id text, section_code text not null, section_title text not null,
 section_description text, section_order integer not null check(section_order>0), section_criticality text, mandatory boolean not null default true,
 section_status text not null default 'Not Started', progress_percent numeric not null default 0, total_items integer not null default 0,
 completed_items integer not null default 0, pending_items integer not null default 0, non_compliant_items integer not null default 0,
 evidence_missing_count integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists audit_execution_sections_order_idx on public.audit_execution_sections(execution_id,section_order);

create table if not exists public.audit_execution_items (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 execution_id text not null references public.audit_executions(id) on delete cascade, execution_section_id text not null references public.audit_execution_sections(id) on delete cascade,
 checklist_item_id text, item_code text not null, item_text text not null, item_order integer not null check(item_order>0), question_type text not null, response_type text not null,
 required_response boolean not null default true, mandatory_evidence boolean not null default false, may_create_finding boolean not null default true,
 safety_critical boolean not null default false, regulatory_critical boolean not null default false, psm_critical boolean not null default false,
 severity_foundation text, expected_evidence text, guidance_text text, standard_snapshot_json jsonb, module_snapshot_json jsonb,
 applicability_condition_json jsonb, not_applicable_allowed boolean not null default true, comments_required boolean not null default false,
 attachments_allowed boolean not null default true, attachments_required boolean not null default false, future_scoring_weight numeric,
 item_status text not null default 'Not Answered', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists audit_execution_items_order_idx on public.audit_execution_items(execution_id,execution_section_id,item_order);

create table if not exists public.audit_execution_responses (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 execution_id text not null references public.audit_executions(id) on delete cascade, execution_section_id text not null references public.audit_execution_sections(id) on delete cascade,
 execution_item_id text not null references public.audit_execution_items(id) on delete cascade, response_value_json jsonb, response_text text,
 response_status text not null, compliance_result text not null, comment text, na_justification text, evidence_required boolean not null default false,
 evidence_status text not null default 'Not Required', finding_created boolean not null default false, field_finding_id text,
 responded_by text references public."User"(id) on delete set null, responded_at timestamptz, reviewed_by text references public."User"(id) on delete set null,
 reviewed_at timestamptz, review_status text, last_updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(execution_id,execution_item_id)
);
create index if not exists audit_execution_responses_item_idx on public.audit_execution_responses(execution_id,execution_item_id);

create table if not exists public.audit_field_notes (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null, area_id text references public."Area"(id) on delete set null, equipment_id text,
 execution_id text not null references public.audit_executions(id) on delete cascade, execution_section_id text references public.audit_execution_sections(id) on delete set null,
 execution_item_id text references public.audit_execution_items(id) on delete set null, note_title text not null, note_type text not null, note_text text not null,
 related_module text, related_record_id text, criticality text, visibility text, converted_to_finding boolean not null default false, field_finding_id text,
 created_by text references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_by text references public."User"(id) on delete set null,
 updated_at timestamptz, deleted_at timestamptz, deleted_by text references public."User"(id) on delete set null, delete_reason text
);
create index if not exists audit_field_notes_execution_idx on public.audit_field_notes(execution_id,created_at desc);

create table if not exists public.audit_field_findings (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null, area_id text references public."Area"(id) on delete set null, equipment_id text,
 execution_id text not null references public.audit_executions(id) on delete cascade, execution_section_id text references public.audit_execution_sections(id) on delete set null,
 execution_item_id text references public.audit_execution_items(id) on delete set null, response_id text references public.audit_execution_responses(id) on delete set null,
 field_note_id text references public.audit_field_notes(id) on delete set null, finding_code text, finding_title text not null, finding_type text not null,
 finding_description text not null, source_standard_snapshot_json jsonb, source_module text, source_record_id text, criticality text not null,
 severity_foundation text, risk_potential_foundation text, immediate_concern boolean not null default false, stop_work_recommended boolean not null default false,
 evidence_summary text, root_cause_suspected text, recommended_action text, responsible_owner_user_id text references public."User"(id) on delete set null,
 due_date_recommendation date, field_finding_status text not null default 'Draft', converted_to_finding_register boolean not null default false,
 finding_register_id text, created_by text references public."User"(id) on delete set null, updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), cancelled_by text references public."User"(id) on delete set null,
 cancelled_at timestamptz, cancel_reason text
);
alter table public.audit_execution_responses drop constraint if exists audit_execution_responses_field_finding_id_fkey;
alter table public.audit_execution_responses add constraint audit_execution_responses_field_finding_id_fkey foreign key(field_finding_id) references public.audit_field_findings(id) on delete set null;
alter table public.audit_field_notes drop constraint if exists audit_field_notes_field_finding_id_fkey;
alter table public.audit_field_notes add constraint audit_field_notes_field_finding_id_fkey foreign key(field_finding_id) references public.audit_field_findings(id) on delete set null;
create index if not exists audit_field_findings_status_idx on public.audit_field_findings(execution_id,field_finding_status);
create index if not exists audit_field_findings_scope_idx on public.audit_field_findings(site_id,unit_id,criticality);

create table if not exists public.audit_execution_evidence_links (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 execution_id text not null references public.audit_executions(id) on delete cascade, execution_section_id text references public.audit_execution_sections(id) on delete set null,
 execution_item_id text references public.audit_execution_items(id) on delete set null, response_id text references public.audit_execution_responses(id) on delete set null,
 field_finding_id text references public.audit_field_findings(id) on delete set null, evidence_title text not null, evidence_type text not null,
 evidence_description text, document_id text, storage_file_id text, related_module text, related_record_id text, confidentiality_level text,
 evidence_status text not null, uploaded_by text references public."User"(id) on delete set null, linked_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz, remove_reason text
);
create index if not exists audit_execution_evidence_idx on public.audit_execution_evidence_links(execution_id,field_finding_id);

create table if not exists public.audit_execution_interviews (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null, area_id text references public."Area"(id) on delete set null, execution_id text not null references public.audit_executions(id) on delete cascade,
 interview_title text not null, interviewee_name text, interviewee_user_id text references public."User"(id) on delete set null, interviewee_worker_id text,
 department text, role_title text, interview_at timestamptz, interviewer_user_id text references public."User"(id) on delete set null,
 execution_section_id text references public.audit_execution_sections(id) on delete set null, execution_item_id text references public.audit_execution_items(id) on delete set null,
 summary text, key_points_json jsonb, follow_up_required boolean not null default false, confidentiality_level text, notes text,
 created_by text references public."User"(id) on delete set null, created_at timestamptz not null default now(), updated_by text references public."User"(id) on delete set null, updated_at timestamptz
);
create table if not exists public.audit_execution_walkthroughs (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null, area_id text references public."Area"(id) on delete set null, equipment_id text,
 execution_id text not null references public.audit_executions(id) on delete cascade, walkthrough_title text not null, walkthrough_at timestamptz,
 auditor_user_id text references public."User"(id) on delete set null, participants_json jsonb, execution_section_id text references public.audit_execution_sections(id) on delete set null,
 execution_item_id text references public.audit_execution_items(id) on delete set null, observations text, field_conditions text,
 follow_up_required boolean not null default false, notes text, created_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(), updated_by text references public."User"(id) on delete set null, updated_at timestamptz
);

create table if not exists public.audit_execution_readiness_checks (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 execution_id text not null references public.audit_executions(id) on delete cascade, readiness_status text not null,
 mandatory_items_answered boolean not null default false, required_comments_complete boolean not null default false,
 required_evidence_complete boolean not null default false, na_justifications_complete boolean not null default false,
 safety_critical_items_reviewed boolean not null default false, validation_errors_resolved boolean not null default false,
 lead_auditor_review_complete boolean not null default false, completion_notes_complete boolean not null default false,
 ready_for_completion boolean not null default false, ready_for_finding_register boolean not null default false,
 missing_items_json jsonb, warnings_json jsonb, checked_by text references public."User"(id) on delete set null,
 checked_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.audit_execution_validation_results (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 execution_id text not null references public.audit_executions(id) on delete cascade, validation_status text not null, validation_type text not null,
 errors_json jsonb, warnings_json jsonb, result_summary_json jsonb, validated_by text references public."User"(id) on delete set null,
 validated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.audit_execution_activity_events (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null, area_id text references public."Area"(id) on delete set null, execution_id text not null references public.audit_executions(id) on delete cascade,
 execution_section_id text, execution_item_id text, response_id text, field_finding_id text, event_type text not null, event_title text not null,
 event_description text, actor_user_id text references public."User"(id) on delete set null, source_module text not null default 'Audit Execution', source_record_id text,
 created_at timestamptz not null default now()
);
create table if not exists public.audit_execution_history_events (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null, area_id text references public."Area"(id) on delete set null, program_id text, plan_id text, checklist_id text,
 execution_id text, response_id text, field_finding_id text, event_type text not null, event_title text not null, event_description text,
 before_value_json jsonb, after_value_json jsonb, actor_user_id text references public."User"(id) on delete set null,
 source_module text not null default 'Audit Execution', source_record_id text, created_at timestamptz not null default now()
);
create index if not exists audit_execution_history_idx on public.audit_execution_history_events(execution_id,created_at desc);

create table if not exists public.audit_execution_settings (
 id text primary key default gen_random_uuid()::text, company_id text not null references public."Tenant"(id) on delete cascade, site_id text references public."Site"(id) on delete cascade,
 require_plan_for_execution boolean not null default true, require_approved_checklist_for_execution boolean not null default true,
 require_lead_auditor_to_start boolean not null default true, require_team_member_to_execute boolean not null default false,
 require_all_mandatory_items_for_completion boolean not null default true, require_evidence_for_mandatory_evidence_items boolean not null default true,
 require_comment_for_non_compliant boolean not null default true, require_na_justification boolean not null default true,
 require_field_finding_for_safety_critical_non_compliance boolean not null default true, allow_execution_reopen boolean not null default true,
 allow_offline_mode_foundation boolean not null default false, auto_create_field_finding_from_non_compliance boolean not null default false,
 notify_lead_on_safety_critical_finding boolean not null default true, update_plan_status_on_execution_start boolean not null default true,
 update_plan_status_on_execution_complete boolean not null default true, settings_json jsonb, updated_by text references public."User"(id) on delete set null,
 updated_at timestamptz not null default now()
);
create unique index if not exists audit_execution_settings_scope_uidx on public.audit_execution_settings(company_id,coalesce(site_id,''));

do $$ declare t text; begin
 foreach t in array array['audit_executions','audit_execution_sections','audit_execution_items','audit_execution_responses','audit_execution_evidence_links','audit_field_notes','audit_field_findings','audit_execution_interviews','audit_execution_walkthroughs','audit_execution_readiness_checks','audit_execution_validation_results','audit_execution_activity_events','audit_execution_history_events','audit_execution_settings'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists %I on public.%I',t||'_tenant_site_policy',t);
  execute format($p$create policy %I on public.%I for all to authenticated using (
    company_id=coalesce(nullif(current_setting('app.current_tenant_id',true),''),auth.jwt()->'app_metadata'->>'tenantId',auth.jwt()->'app_metadata'->>'tenant_id')
    and (
      site_id is null
      or site_id=nullif(current_setting('app.current_site_id',true),'')
      or coalesce(auth.jwt()->'app_metadata'->'siteIds',auth.jwt()->'app_metadata'->'site_ids','[]'::jsonb) ? site_id
      or coalesce(auth.jwt()->'app_metadata'->>'corporateView',auth.jwt()->'app_metadata'->>'corporate_view','false')='true'
      or coalesce(auth.jwt()->'app_metadata'->>'isCompanyAdmin',auth.jwt()->'app_metadata'->>'is_company_admin','false')='true'
      or coalesce(auth.jwt()->'app_metadata'->>'isSuperAdmin',auth.jwt()->'app_metadata'->>'is_super_admin','false')='true'
    )
  ) with check (
    company_id=coalesce(nullif(current_setting('app.current_tenant_id',true),''),auth.jwt()->'app_metadata'->>'tenantId',auth.jwt()->'app_metadata'->>'tenant_id')
    and (
      site_id is null
      or site_id=nullif(current_setting('app.current_site_id',true),'')
      or coalesce(auth.jwt()->'app_metadata'->'siteIds',auth.jwt()->'app_metadata'->'site_ids','[]'::jsonb) ? site_id
      or coalesce(auth.jwt()->'app_metadata'->>'corporateView',auth.jwt()->'app_metadata'->>'corporate_view','false')='true'
      or coalesce(auth.jwt()->'app_metadata'->>'isCompanyAdmin',auth.jwt()->'app_metadata'->>'is_company_admin','false')='true'
      or coalesce(auth.jwt()->'app_metadata'->>'isSuperAdmin',auth.jwt()->'app_metadata'->>'is_super_admin','false')='true'
    )
  )$p$,t||'_tenant_site_policy',t);
  execute format('grant select, insert, update, delete on public.%I to authenticated',t);
 end loop;
end $$;

do $$ declare tenant_id text; p text; begin
 foreach tenant_id in array(select id from public."Tenant") loop
  foreach p in array array['audit.execution.view','audit.execution.dashboard.view','audit.execution.register.view','audit.execution.create','audit.execution.start','audit.execution.pause','audit.execution.resume','audit.execution.complete','audit.execution.reopen','audit.execution.cancel','audit.execution.workspace.view','audit.execution.response.view','audit.execution.response.create','audit.execution.response.edit','audit.execution.response.reopen','audit.execution.evidence.view','audit.execution.evidence.add','audit.execution.evidence.remove','audit.execution.note.view','audit.execution.note.create','audit.execution.note.edit','audit.execution.note.delete','audit.field_finding.view','audit.field_finding.create','audit.field_finding.edit','audit.field_finding.cancel','audit.field_finding.convert_foundation','audit.execution.interview.view','audit.execution.interview.create','audit.execution.interview.edit','audit.execution.walkthrough.view','audit.execution.walkthrough.create','audit.execution.walkthrough.edit','audit.execution.readiness.run','audit.execution.history.view','audit.execution.settings.view','audit.execution.settings.edit'] loop
   insert into public."Permission"("id","tenantId","key","moduleKey","label") select gen_random_uuid()::text,tenant_id,p,'AUDIT',initcap(replace(p,'.',' ')) where not exists(select 1 from public."Permission" where "tenantId"=tenant_id and "key"=p);
  end loop;
 end loop;
end $$;
