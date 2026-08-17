create extension if not exists pgcrypto;

create table if not exists public.audit_capa_packages (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 equipment_id text,
 program_id text references public.audit_programs(id) on delete set null,
 plan_id text references public.audit_plans(id) on delete set null,
 execution_id text references public.audit_executions(id) on delete set null,
 primary_finding_id text references public.audit_findings(id) on delete restrict,
 capa_code text not null,
 capa_title text not null,
 capa_description text,
 capa_category text not null default 'Audit Finding CAPA',
 capa_status text not null default 'Draft',
 closure_readiness_status text not null default 'Not Ready',
 verification_status text not null default 'Not Required',
 effectiveness_status text not null default 'Not Required',
 criticality text not null default 'Medium',
 priority text,
 suspected_cause text,
 cause_category text,
 system_weakness text,
 contributing_factors_json jsonb,
 rca_required boolean not null default false,
 rca_method text,
 rca_record_id text,
 capa_owner_user_id text references public."User"(id) on delete set null,
 reviewer_user_id text references public."User"(id) on delete set null,
 responsible_department_id text,
 escalation_owner_user_id text references public."User"(id) on delete set null,
 overall_due_date date,
 severity_sla_category text,
 source_snapshot_json jsonb,
 created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 opened_by text references public."User"(id) on delete set null,
 opened_at timestamptz,
 closed_by text references public."User"(id) on delete set null,
 closed_at timestamptz,
 closure_note text,
 reopened_by text references public."User"(id) on delete set null,
 reopened_at timestamptz,
 reopen_reason text,
 archived_at timestamptz,
 archived_by text references public."User"(id) on delete set null,
 archive_reason text
);
create unique index if not exists audit_capa_packages_company_site_code_uidx on public.audit_capa_packages(company_id, coalesce(site_id,''), capa_code);
create index if not exists audit_capa_packages_status_idx on public.audit_capa_packages(company_id, site_id, capa_status);
create index if not exists audit_capa_packages_primary_finding_idx on public.audit_capa_packages(primary_finding_id);
create index if not exists audit_capa_packages_program_idx on public.audit_capa_packages(program_id);
create index if not exists audit_capa_packages_plan_idx on public.audit_capa_packages(plan_id);
create index if not exists audit_capa_packages_execution_idx on public.audit_capa_packages(execution_id);
create index if not exists audit_capa_packages_owner_idx on public.audit_capa_packages(capa_owner_user_id);
create index if not exists audit_capa_packages_due_idx on public.audit_capa_packages(overall_due_date);

create table if not exists public.audit_capa_finding_links (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 capa_id text not null references public.audit_capa_packages(id) on delete cascade,
 finding_id text not null references public.audit_findings(id) on delete restrict,
 link_type text not null default 'Primary Finding',
 primary_finding boolean not null default false,
 grouping_reason text,
 finding_snapshot_json jsonb,
 linked_by text references public."User"(id) on delete set null,
 linked_at timestamptz not null default now(),
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text
);
create unique index if not exists audit_capa_finding_links_unique_active_idx on public.audit_capa_finding_links(capa_id, finding_id) where removed_at is null;
create index if not exists audit_capa_finding_links_idx on public.audit_capa_finding_links(capa_id, finding_id);

create table if not exists public.audit_capa_actions (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 equipment_id text,
 capa_id text not null references public.audit_capa_packages(id) on delete cascade,
 finding_id text references public.audit_findings(id) on delete set null,
 action_engine_id text,
 action_code text,
 action_title text not null,
 action_description text,
 action_type text not null,
 action_status text not null default 'Draft',
 priority text not null default 'Medium',
 owner_user_id text references public."User"(id) on delete set null,
 verifier_user_id text references public."User"(id) on delete set null,
 responsible_department_id text,
 linked_module text,
 linked_record_id text,
 due_date date,
 completed_at timestamptz,
 completed_by text references public."User"(id) on delete set null,
 completion_summary text,
 evidence_required boolean not null default false,
 verification_required boolean not null default false,
 effectiveness_required boolean not null default false,
 completion_criteria text,
 source_action_snapshot_json jsonb,
 created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 cancelled_by text references public."User"(id) on delete set null,
 cancelled_at timestamptz,
 cancel_reason text
);
create index if not exists audit_capa_actions_status_idx on public.audit_capa_actions(capa_id, action_status);
create index if not exists audit_capa_actions_engine_idx on public.audit_capa_actions(action_engine_id);
create index if not exists audit_capa_actions_owner_due_idx on public.audit_capa_actions(owner_user_id, due_date);

create table if not exists public.audit_capa_containment_records (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 equipment_id text,
 capa_id text not null references public.audit_capa_packages(id) on delete cascade,
 finding_id text references public.audit_findings(id) on delete set null,
 containment_required boolean not null default false,
 containment_description text,
 containment_owner_user_id text references public."User"(id) on delete set null,
 containment_due_date date,
 containment_status text not null default 'Draft',
 evidence_required boolean not null default false,
 stop_work_recommendation boolean not null default false,
 interim_control_description text,
 action_engine_id text,
 completed_by text references public."User"(id) on delete set null,
 completed_at timestamptz,
 completion_note text,
 verified_by text references public."User"(id) on delete set null,
 verified_at timestamptz,
 verification_note text,
 created_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_capa_action_evidence_links (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 capa_id text not null references public.audit_capa_packages(id) on delete cascade,
 capa_action_id text references public.audit_capa_actions(id) on delete cascade,
 finding_id text references public.audit_findings(id) on delete set null,
 evidence_title text not null,
 evidence_type text not null,
 evidence_description text,
 document_id text,
 storage_file_id text,
 action_engine_evidence_id text,
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
create index if not exists audit_capa_evidence_capa_idx on public.audit_capa_action_evidence_links(capa_id, capa_action_id);

create table if not exists public.audit_capa_verification_records (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 capa_id text not null references public.audit_capa_packages(id) on delete cascade,
 capa_action_id text references public.audit_capa_actions(id) on delete cascade,
 finding_id text references public.audit_findings(id) on delete set null,
 verification_required boolean not null default true,
 verification_method text not null default 'Document Review',
 verifier_user_id text references public."User"(id) on delete set null,
 verification_status text not null default 'Pending Verification',
 verification_due_date date,
 verification_decision text,
 verification_comment text,
 evidence_required boolean not null default false,
 verified_by text references public."User"(id) on delete set null,
 verified_at timestamptz,
 rejected_by text references public."User"(id) on delete set null,
 rejected_at timestamptz,
 rejection_reason text,
 rework_required boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists audit_capa_verification_status_idx on public.audit_capa_verification_records(capa_id, verification_status);

create table if not exists public.audit_capa_effectiveness_checks (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 capa_id text not null references public.audit_capa_packages(id) on delete cascade,
 finding_id text references public.audit_findings(id) on delete set null,
 effectiveness_required boolean not null default false,
 effectiveness_method text,
 effectiveness_owner_user_id text references public."User"(id) on delete set null,
 effectiveness_due_date date,
 effectiveness_criteria text,
 follow_up_audit_required boolean not null default false,
 repeat_finding_watch_window_days integer,
 effectiveness_status text not null default 'Not Required',
 effectiveness_result text,
 effectiveness_comment text,
 checked_by text references public."User"(id) on delete set null,
 checked_at timestamptz,
 follow_up_action_engine_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists audit_capa_effectiveness_status_idx on public.audit_capa_effectiveness_checks(capa_id, effectiveness_status);

create table if not exists public.audit_capa_closure_readiness_checks (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 capa_id text references public.audit_capa_packages(id) on delete cascade,
 finding_id text references public.audit_findings(id) on delete set null,
 readiness_status text not null,
 finding_confirmed boolean not null default false,
 capa_exists boolean not null default false,
 corrective_actions_created boolean not null default false,
 preventive_actions_created boolean not null default false,
 containment_complete boolean not null default false,
 required_actions_complete boolean not null default false,
 required_evidence_attached boolean not null default false,
 verification_complete boolean not null default false,
 effectiveness_complete boolean not null default false,
 no_rejected_or_reopened_actions boolean not null default false,
 no_overdue_required_actions boolean not null default false,
 review_complete boolean not null default false,
 missing_items_json jsonb,
 warnings_json jsonb,
 checked_by text references public."User"(id) on delete set null,
 checked_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_capa_action_sync_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 capa_id text references public.audit_capa_packages(id) on delete cascade,
 capa_action_id text references public.audit_capa_actions(id) on delete cascade,
 action_engine_id text,
 sync_type text not null,
 sync_status text not null,
 sync_message text,
 before_value_json jsonb,
 after_value_json jsonb,
 triggered_by text references public."User"(id) on delete set null,
 triggered_at timestamptz not null default now(),
 completed_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.audit_capa_status_transitions (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 capa_id text not null references public.audit_capa_packages(id) on delete cascade,
 from_status text,
 to_status text not null,
 transition_reason text,
 transitioned_by text references public."User"(id) on delete set null,
 transitioned_at timestamptz not null default now(),
 validation_result_json jsonb,
 created_at timestamptz not null default now()
);

create table if not exists public.audit_capa_history_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 program_id text,
 plan_id text,
 execution_id text,
 finding_id text references public.audit_findings(id) on delete set null,
 capa_id text references public.audit_capa_packages(id) on delete set null,
 capa_action_id text references public.audit_capa_actions(id) on delete set null,
 action_engine_id text,
 event_type text not null,
 event_title text not null,
 event_description text,
 before_value_json jsonb,
 after_value_json jsonb,
 actor_user_id text references public."User"(id) on delete set null,
 source_module text not null default 'Audit CAPA / Action Integration',
 source_record_id text,
 created_at timestamptz not null default now()
);
create index if not exists audit_capa_history_events_idx on public.audit_capa_history_events(capa_id, created_at desc);

create table if not exists public.audit_capa_settings (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete cascade,
 require_capa_for_confirmed_findings boolean not null default true,
 require_capa_for_safety_critical boolean not null default true,
 require_capa_for_regulatory_critical boolean not null default true,
 require_capa_for_repeat_findings boolean not null default true,
 require_containment_decision_for_safety_critical boolean not null default true,
 require_corrective_action_for_non_conformance boolean not null default true,
 require_preventive_action_for_repeat_findings boolean not null default true,
 require_verification_for_safety_critical_actions boolean not null default true,
 require_effectiveness_for_safety_critical_capa boolean not null default true,
 require_effectiveness_for_repeat_findings boolean not null default true,
 allow_finding_closure_without_capa boolean not null default false,
 allow_action_owner_self_verification boolean not null default false,
 auto_create_actions_in_action_engine boolean not null default true,
 auto_sync_action_status boolean not null default true,
 auto_mark_overdue boolean not null default true,
 auto_notify_action_owner boolean not null default true,
 auto_notify_verifier boolean not null default true,
 auto_notify_overdue_to_escalation_owner boolean not null default true,
 settings_json jsonb,
 updated_by text references public."User"(id) on delete set null,
 updated_at timestamptz not null default now()
);
create unique index if not exists audit_capa_settings_scope_uidx on public.audit_capa_settings(company_id, coalesce(site_id,''));

do $$ declare t text; begin
 foreach t in array array[
  'audit_capa_packages','audit_capa_finding_links','audit_capa_actions','audit_capa_containment_records',
  'audit_capa_action_evidence_links','audit_capa_verification_records','audit_capa_effectiveness_checks',
  'audit_capa_closure_readiness_checks','audit_capa_action_sync_events','audit_capa_status_transitions',
  'audit_capa_history_events','audit_capa_settings'
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
   'audit.capa.view','audit.capa.dashboard.view','audit.capa.register.view','audit.capa.create','audit.capa.edit',
   'audit.capa.open','audit.capa.close','audit.capa.reopen','audit.capa.archive','audit.capa.create_from_finding',
   'audit.capa.finding.link','audit.capa.action.view','audit.capa.action.create','audit.capa.action.edit',
   'audit.capa.action.assign','audit.capa.action.complete','audit.capa.action.verify','audit.capa.action.reject',
   'audit.capa.action.reopen','audit.capa.containment.view','audit.capa.containment.manage','audit.capa.evidence.view',
   'audit.capa.evidence.add','audit.capa.evidence.remove','audit.capa.verification.view','audit.capa.verification.perform',
   'audit.capa.effectiveness.view','audit.capa.effectiveness.perform','audit.capa.closure_readiness.run',
   'audit.capa.sync_action_engine','audit.capa.history.view','audit.capa.settings.view','audit.capa.settings.edit'
  ] loop
   insert into public."Permission"("id","tenantId","key","moduleKey","label")
   select gen_random_uuid()::text, tenant_id, p, 'AUDIT', initcap(replace(p, '.', ' '))
   where not exists(select 1 from public."Permission" where "tenantId" = tenant_id and "key" = p);
  end loop;
 end loop;
end $$;
