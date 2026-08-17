create extension if not exists pgcrypto;

create table if not exists public.audit_scoring_models (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 model_code text not null,
 model_title text not null,
 model_type text not null default 'Weighted Compliance',
 description text,
 methodology_version text not null default '1.0',
 model_status text not null default 'Draft',
 effective_date date,
 owner_user_id text references public."User"(id) on delete set null,
 reviewer_user_id text references public."User"(id) on delete set null,
 applicable_scope_json jsonb,
 applicable_audit_types_json jsonb,
 applicable_modules_json jsonb,
 applicable_standards_json jsonb,
 default_model boolean not null default false,
 created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 approved_by text references public."User"(id) on delete set null,
 approved_at timestamptz,
 archived_at timestamptz,
 archived_by text references public."User"(id) on delete set null,
 archive_reason text
);
create unique index if not exists audit_scoring_models_company_site_code_uidx on public.audit_scoring_models(company_id, coalesce(site_id,''), model_code);
create index if not exists audit_scoring_models_status_idx on public.audit_scoring_models(company_id, site_id, model_status);
create index if not exists audit_scoring_models_code_idx on public.audit_scoring_models(model_code);

create table if not exists public.audit_scoring_rules (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 model_id text not null references public.audit_scoring_models(id) on delete cascade,
 rule_code text not null,
 rule_title text not null,
 rule_type text not null,
 rule_category text not null,
 applies_to text not null,
 rule_order integer not null default 1,
 weight numeric,
 points numeric,
 penalty numeric,
 multiplier numeric,
 cap_score numeric,
 fail_condition boolean not null default false,
 condition_json jsonb,
 calculation_json jsonb not null default '{}'::jsonb,
 explanation_template text,
 active boolean not null default true,
 created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 archived_at timestamptz,
 archived_by text references public."User"(id) on delete set null,
 archive_reason text
);
create index if not exists audit_scoring_rules_order_idx on public.audit_scoring_rules(model_id, rule_order);
create unique index if not exists audit_scoring_rules_model_code_uidx on public.audit_scoring_rules(model_id, rule_code);

create table if not exists public.audit_score_runs (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 program_id text references public.audit_programs(id) on delete set null,
 plan_id text references public.audit_plans(id) on delete set null,
 execution_id text references public.audit_executions(id) on delete set null,
 checklist_id text references public.audit_checklist_templates(id) on delete set null,
 finding_id text references public.audit_findings(id) on delete set null,
 capa_id text references public.audit_capa_packages(id) on delete set null,
 model_id text not null references public.audit_scoring_models(id) on delete restrict,
 score_code text not null,
 score_title text not null,
 source_object_type text not null,
 source_object_id text not null,
 score_status text not null default 'Draft',
 readiness_status text not null default 'Input Missing',
 stale_status text not null default 'Current',
 stale_reason text,
 methodology_version text not null,
 methodology_snapshot_json jsonb not null default '{}'::jsonb,
 input_snapshot_json jsonb not null default '{}'::jsonb,
 calculation_trace_json jsonb not null default '[]'::jsonb,
 score_result_json jsonb not null default '{}'::jsonb,
 final_score numeric,
 original_calculated_score numeric,
 adjusted_score numeric,
 score_grade text,
 score_percent numeric,
 max_possible_score numeric,
 points_earned numeric,
 points_lost numeric,
 penalties_total numeric,
 caps_applied_json jsonb,
 critical_blockers_json jsonb,
 evidence_impact_json jsonb,
 finding_impact_json jsonb,
 capa_impact_json jsonb,
 calculated_by text references public."User"(id) on delete set null,
 calculated_at timestamptz,
 verified_by text references public."User"(id) on delete set null,
 verified_at timestamptz,
 locked_by text references public."User"(id) on delete set null,
 locked_at timestamptz,
 lock_reason text,
 failed_reason text,
 created_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 archived_at timestamptz,
 archived_by text references public."User"(id) on delete set null,
 archive_reason text
);
create unique index if not exists audit_score_runs_company_code_uidx on public.audit_score_runs(company_id, score_code);
create index if not exists audit_score_runs_status_idx on public.audit_score_runs(company_id, site_id, score_status);
create index if not exists audit_score_runs_source_idx on public.audit_score_runs(source_object_type, source_object_id);
create index if not exists audit_score_runs_model_calc_idx on public.audit_score_runs(model_id, calculated_at);
create index if not exists audit_score_runs_program_idx on public.audit_score_runs(program_id);
create index if not exists audit_score_runs_plan_idx on public.audit_score_runs(plan_id);
create index if not exists audit_score_runs_execution_idx on public.audit_score_runs(execution_id);

create table if not exists public.audit_score_components (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 score_run_id text not null references public.audit_score_runs(id) on delete cascade,
 parent_component_id text references public.audit_score_components(id) on delete cascade,
 component_type text not null,
 component_key text not null,
 component_title text not null,
 source_module text,
 source_record_id text,
 standard_name text,
 clause_reference text,
 module_key text,
 weight numeric,
 max_points numeric,
 earned_points numeric,
 lost_points numeric,
 penalty numeric,
 component_score numeric,
 component_grade text,
 component_status text not null default 'Calculated',
 explanation text,
 trace_json jsonb,
 created_at timestamptz not null default now()
);
create index if not exists audit_score_components_run_type_idx on public.audit_score_components(score_run_id, component_type);

create table if not exists public.audit_score_rule_results (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 score_run_id text not null references public.audit_score_runs(id) on delete cascade,
 rule_id text references public.audit_scoring_rules(id) on delete set null,
 rule_code text not null,
 rule_title text not null,
 rule_type text not null,
 source_module text,
 source_record_id text,
 applied boolean not null default false,
 points_delta numeric,
 penalty_delta numeric,
 cap_applied numeric,
 fail_condition_triggered boolean not null default false,
 result_status text not null default 'Calculated',
 explanation text,
 result_json jsonb,
 created_at timestamptz not null default now()
);
create index if not exists audit_score_rule_results_run_rule_idx on public.audit_score_rule_results(score_run_id, rule_code);

create table if not exists public.audit_score_input_records (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 score_run_id text not null references public.audit_score_runs(id) on delete cascade,
 input_type text not null,
 source_module text not null,
 source_record_id text not null,
 source_snapshot_json jsonb,
 included boolean not null default true,
 excluded_reason text,
 restricted boolean not null default false,
 stale_sensitive boolean not null default true,
 created_at timestamptz not null default now()
);
create index if not exists audit_score_input_records_run_input_idx on public.audit_score_input_records(score_run_id, input_type);

create table if not exists public.audit_score_adjustments (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 score_run_id text not null references public.audit_score_runs(id) on delete cascade,
 adjustment_type text not null,
 adjustment_value numeric,
 original_value numeric,
 adjusted_value numeric,
 related_source_module text,
 related_source_record_id text,
 adjustment_reason text not null,
 risk_compliance_justification text,
 approval_required boolean not null default false,
 approval_request_id text,
 adjustment_status text not null default 'Pending Approval',
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
create index if not exists audit_score_adjustments_status_idx on public.audit_score_adjustments(score_run_id, adjustment_status);

create table if not exists public.audit_score_verification_records (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 score_run_id text not null references public.audit_score_runs(id) on delete cascade,
 verification_status text not null,
 verification_comment text,
 verified_by text references public."User"(id) on delete set null,
 verified_at timestamptz,
 review_required boolean not null default false,
 approval_request_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_score_staleness_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 score_run_id text not null references public.audit_score_runs(id) on delete cascade,
 stale_trigger_type text not null,
 source_module text not null,
 source_record_id text not null,
 stale_reason text not null,
 detected_at timestamptz not null default now(),
 resolved_by text references public."User"(id) on delete set null,
 resolved_at timestamptz,
 resolution_note text,
 created_at timestamptz not null default now()
);
create index if not exists audit_score_staleness_events_run_idx on public.audit_score_staleness_events(score_run_id, detected_at);

create table if not exists public.audit_score_snapshots (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 score_run_id text not null references public.audit_score_runs(id) on delete cascade,
 snapshot_type text not null,
 snapshot_json jsonb not null,
 snapshot_hash text,
 created_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now()
);

create table if not exists public.audit_score_history_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 program_id text references public.audit_programs(id) on delete set null,
 plan_id text references public.audit_plans(id) on delete set null,
 execution_id text references public.audit_executions(id) on delete set null,
 score_run_id text references public.audit_score_runs(id) on delete set null,
 model_id text references public.audit_scoring_models(id) on delete set null,
 event_type text not null,
 event_title text not null,
 event_description text not null,
 before_value_json jsonb,
 after_value_json jsonb,
 actor_user_id text references public."User"(id) on delete set null,
 source_module text not null default 'Audit Compliance Scoring',
 source_record_id text,
 created_at timestamptz not null default now()
);
create index if not exists audit_score_history_events_run_idx on public.audit_score_history_events(score_run_id, created_at);

create table if not exists public.audit_scoring_settings (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 default_model_id text references public.audit_scoring_models(id) on delete set null,
 score_scale_min numeric not null default 0,
 score_scale_max numeric not null default 100,
 grade_a_min numeric not null default 90,
 grade_b_min numeric not null default 80,
 grade_c_min numeric not null default 70,
 grade_d_min numeric not null default 60,
 critical_failure_below numeric not null default 60,
 require_evidence_for_full_credit boolean not null default true,
 require_verified_evidence_for_full_credit boolean not null default true,
 cap_score_for_open_safety_critical_finding boolean not null default true,
 safety_critical_cap_score numeric not null default 60,
 cap_score_for_open_regulatory_critical_finding boolean not null default true,
 regulatory_critical_cap_score numeric not null default 70,
 require_verified_capa_for_full_recovery boolean not null default true,
 allow_manual_score_adjustment boolean not null default true,
 require_approval_for_manual_adjustment boolean not null default true,
 auto_mark_scores_stale_on_source_change boolean not null default true,
 auto_recalculate_on_execution_complete boolean not null default false,
 auto_recalculate_on_evidence_verified boolean not null default false,
 auto_recalculate_on_capa_verified boolean not null default false,
 settings_json jsonb,
 updated_by text references public."User"(id) on delete set null,
 updated_at timestamptz not null default now(),
 unique(company_id, site_id)
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'audit_scoring_models','audit_scoring_rules','audit_score_runs','audit_score_components',
    'audit_score_rule_results','audit_score_input_records','audit_score_adjustments',
    'audit_score_verification_records','audit_score_staleness_events','audit_score_snapshots',
    'audit_score_history_events','audit_scoring_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_isolation', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', table_name || '_tenant_isolation', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

do $$
declare tenant_id text;
declare permission_key text;
declare permission_label text;
begin
  for tenant_id in select id from public."Tenant" loop
    foreach permission_key, permission_label in array array[
      ['audit.scoring.view','View audit compliance scoring'],
      ['audit.scoring.dashboard.view','View audit scoring dashboard'],
      ['audit.scoring.register.view','View audit score register'],
      ['audit.scoring.run.create','Create audit score run'],
      ['audit.scoring.run.recalculate','Recalculate audit score run'],
      ['audit.scoring.run.view','View audit score run'],
      ['audit.scoring.run.verify','Verify audit score run'],
      ['audit.scoring.run.lock','Lock audit score run'],
      ['audit.scoring.run.unlock','Unlock audit score run'],
      ['audit.scoring.run.archive','Archive audit score run'],
      ['audit.scoring.model.view','View audit scoring model'],
      ['audit.scoring.model.create','Create audit scoring model'],
      ['audit.scoring.model.edit','Edit audit scoring model'],
      ['audit.scoring.model.activate','Activate audit scoring model'],
      ['audit.scoring.model.archive','Archive audit scoring model'],
      ['audit.scoring.rule.view','View audit scoring rules'],
      ['audit.scoring.rule.manage','Manage audit scoring rules'],
      ['audit.scoring.adjustment.view','View audit score adjustments'],
      ['audit.scoring.adjustment.create','Create audit score adjustment'],
      ['audit.scoring.adjustment.approve','Approve audit score adjustment'],
      ['audit.scoring.adjustment.remove','Remove audit score adjustment'],
      ['audit.scoring.explainability.view','View audit score explainability'],
      ['audit.scoring.traceability.view','View audit score traceability'],
      ['audit.scoring.stale.view','View stale audit scores'],
      ['audit.scoring.history.view','View audit scoring history'],
      ['audit.scoring.settings.view','View audit scoring settings'],
      ['audit.scoring.settings.edit','Edit audit scoring settings']
    ] loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'AUDIT', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
