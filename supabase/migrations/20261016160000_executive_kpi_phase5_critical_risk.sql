-- Executive KPI Phase 5: controlled executive attention. Source modules remain authoritative.
create table if not exists public.executive_risk_priority_policy_versions (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete cascade, policy_code text not null,
  version_number integer not null default 1, configuration_json jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default now(), effective_until timestamptz null,
  approved_by text null, approved_at timestamptz null, created_by text null, created_at timestamptz not null default now(),
  unique(company_id, site_id, policy_code, version_number)
);

create table if not exists public.executive_risk_cases (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null references public."Site"(id) on delete set null, department_id text null, unit_id text null, area_id text null, equipment_id text null,
  case_code text not null, case_title text not null, case_type text not null default 'Critical Risk', risk_category text null,
  source_module text not null, source_record_type text not null, source_record_id text not null, canonical_source_key text not null,
  psm_element_id text null references public.executive_psm_elements(id) on delete set null,
  source_severity text null, source_criticality text null, executive_priority text not null, prioritization_score numeric null,
  priority_explanation_json jsonb not null default '{}'::jsonb, ranking_policy_version_id text null references public.executive_risk_priority_policy_versions(id) on delete set null,
  source_status text null, case_status text not null default 'Open', barrier_impaired boolean null,
  executive_owner_user_id text null, operational_owner_user_id text null,
  first_detected_at timestamptz not null default now(), last_observed_at timestamptz not null default now(), source_updated_at timestamptz null,
  last_aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  data_freshness_status text not null default 'Current', acknowledgment_status text not null default 'Unacknowledged', acknowledgment_due_at timestamptz null,
  current_escalation_level integer null, escalation_status text null, open_action_count integer not null default 0, overdue_action_count integer not null default 0,
  pending_verification_count integer not null default 0, source_resolved_at timestamptz null, closed_at timestamptz null, closed_by text null,
  closure_reason text null, reopened_at timestamptz null, reopened_reason text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, canonical_source_key)
);
create table if not exists public.executive_risk_case_source_links (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  risk_case_id text not null references public.executive_risk_cases(id) on delete cascade, source_module text not null, source_record_type text not null, source_record_id text not null,
  relationship_type text not null default 'Canonical source', source_snapshot_json jsonb null, restricted boolean not null default false, linked_at timestamptz not null default now(), linked_by text null,
  unique(risk_case_id, source_module, source_record_type, source_record_id)
);
create table if not exists public.executive_risk_case_action_links (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  risk_case_id text not null references public.executive_risk_cases(id) on delete cascade, universal_action_id text not null,
  source_module text null, relationship_type text not null default 'Follow-up', required_for_case_closure boolean not null default false,
  linked_at timestamptz not null default now(), linked_by text null, unlinked_at timestamptz null, unlink_reason text null,
  unique(risk_case_id, universal_action_id)
);
create table if not exists public.executive_risk_case_ownership_history (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  risk_case_id text not null references public.executive_risk_cases(id) on delete cascade, previous_owner_user_id text null, new_owner_user_id text not null,
  assignment_type text not null, assignment_reason text not null, assigned_by text not null, assigned_at timestamptz not null default now()
);
create table if not exists public.executive_escalation_rules (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete cascade,
  rule_code text not null, rule_title text not null, trigger_type text not null, source_module text null, priority_level text not null,
  severity_condition text null, overdue_threshold_hours integer null, overdue_threshold_days integer null, escalation_level integer not null default 1,
  recipient_role text null, recipient_user_id text null, acknowledgment_sla_minutes integer null, response_sla_minutes integer null,
  calendar_id text null, business_hours_only boolean not null default false, auto_escalate boolean not null default false,
  repeat_escalation_enabled boolean not null default false, max_escalation_level integer null, effective_from timestamptz not null default now(), effective_until timestamptz null,
  version_number integer not null default 1, active boolean not null default true, created_by text null, updated_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz null, archive_reason text null,
  unique(company_id, site_id, rule_code, version_number)
);
create table if not exists public.executive_escalations (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  escalation_code text not null, risk_case_id text null references public.executive_risk_cases(id) on delete set null, universal_action_id text null,
  source_module text not null, source_record_type text not null, source_record_id text not null, trigger_type text not null, escalation_reason text not null,
  escalation_level integer not null default 1, priority text not null, severity text null, escalation_status text not null default 'Active', rule_id text null references public.executive_escalation_rules(id) on delete set null,
  rule_version integer null, escalated_from_user_id text null, escalated_to_user_id text null, escalated_to_role text null, escalation_owner_user_id text null,
  acknowledgment_due_at timestamptz null, response_due_at timestamptz null, decision_due_at timestamptz null,
  acknowledged_by text null, acknowledged_at timestamptz null, responded_by text null, responded_at timestamptz null, sla_status text not null default 'On Track',
  source_status_snapshot jsonb null, closure_ready boolean not null default false, closed_by text null, closed_at timestamptz null, closure_reason text null,
  cancelled_by text null, cancelled_at timestamptz null, cancellation_reason text null, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, escalation_code)
);
create table if not exists public.executive_escalation_events (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  escalation_id text not null references public.executive_escalations(id) on delete cascade, event_type text not null, event_title text not null, event_description text null,
  previous_status text null, new_status text null, previous_level integer null, new_level integer null, actor_user_id text null, event_source text not null default 'Executive KPI', created_at timestamptz not null default now()
);
create table if not exists public.executive_risk_case_acknowledgments (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  risk_case_id text not null references public.executive_risk_cases(id) on delete cascade, escalation_id text null references public.executive_escalations(id) on delete set null,
  recipient_user_id text not null, acknowledgment_type text not null, acknowledgment_note text null, acknowledged_at timestamptz not null default now(), source_context_version text null, sla_status_at_acknowledgment text null, created_at timestamptz not null default now()
);
create table if not exists public.executive_management_decisions (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  decision_code text not null, risk_case_id text null references public.executive_risk_cases(id) on delete set null, escalation_id text null references public.executive_escalations(id) on delete set null,
  decision_type text not null, decision_summary text not null, decision_rationale text not null, decision_status text not null default 'Open', decision_maker_user_id text not null,
  decision_at timestamptz not null default now(), follow_up_owner_user_id text null, due_at timestamptz null, universal_action_id text null, review_package_id text null, esignature_reference_id text null,
  created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, decision_code)
);
create table if not exists public.executive_risk_verification_records (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  risk_case_id text not null references public.executive_risk_cases(id) on delete cascade, source_module text not null, source_record_id text not null,
  verification_type text not null, verification_status text not null default 'Requested', required boolean not null default true, verifier_user_id text null, verified_at timestamptz null,
  verification_note text null, evidence_reference_id text null, source_verification_reference text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.executive_overdue_action_snapshots (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  department_id text null, unit_id text null, aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null,
  universal_action_id text not null, canonical_action_key text not null, action_code text null, source_modules_json jsonb not null default '[]'::jsonb,
  action_priority text null, action_criticality text null, original_due_at timestamptz null, effective_due_at timestamptz not null, overdue_days integer not null default 0,
  extension_count integer not null default 0, action_status text not null, verification_status text null, owner_user_id text null, executive_owner_user_id text null,
  escalation_level integer null, escalation_status text null, source_updated_at timestamptz null, calculated_at timestamptz not null default now(), created_at timestamptz not null default now(),
  unique(company_id, canonical_action_key, calculated_at)
);
create table if not exists public.executive_risk_aggregation_runs (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  aggregation_run_id text null references public.executive_kpi_aggregation_runs(id) on delete set null, run_status text not null, scope_json jsonb not null default '{}'::jsonb,
  included_modules_json jsonb not null default '[]'::jsonb, excluded_modules_json jsonb not null default '[]'::jsonb, detected_case_count integer not null default 0, active_case_count integer not null default 0,
  restricted_case_count integer not null default 0, duplicate_source_count integer not null default 0, critical_case_count integer not null default 0, overdue_action_count integer not null default 0,
  warning_count integer not null default 0, error_count integer not null default 0, calculation_policy_snapshot_json jsonb null, initiated_by text null, started_at timestamptz not null default now(), completed_at timestamptz null, safe_error_summary text null, created_at timestamptz not null default now()
);
create table if not exists public.executive_risk_history_events (
  id text primary key, company_id text not null references public."Tenant"(id) on delete cascade, site_id text null references public."Site"(id) on delete set null,
  risk_case_id text null references public.executive_risk_cases(id) on delete set null, escalation_id text null references public.executive_escalations(id) on delete set null,
  universal_action_id text null, management_decision_id text null references public.executive_management_decisions(id) on delete set null,
  event_type text not null, event_title text not null, event_description text null, before_value_json jsonb null, after_value_json jsonb null, actor_user_id text null,
  source_module text null, source_record_id text null, correlation_id text null, created_at timestamptz not null default now()
);

alter table public.executive_kpi_settings
  add column if not exists enable_critical_risk_cockpit boolean not null default true,
  add column if not exists enable_overdue_action_cockpit boolean not null default true,
  add column if not exists enable_executive_escalations boolean not null default true,
  add column if not exists critical_risk_acknowledgment_required boolean not null default true,
  add column if not exists require_source_resolution_for_case_closure boolean not null default true,
  add column if not exists require_verification_for_critical_case_closure boolean not null default true,
  add column if not exists auto_recalculate_critical_risks_after_aggregation boolean not null default true,
  add column if not exists critical_risk_minimum_severity text not null default 'High';

create index if not exists executive_risk_case_scope_idx on public.executive_risk_cases(company_id, site_id, executive_priority, case_status);
create index if not exists executive_risk_case_owner_idx on public.executive_risk_cases(company_id, executive_owner_user_id, case_status);
create index if not exists executive_risk_case_source_idx on public.executive_risk_cases(company_id, source_module, source_record_type, source_record_id);
create index if not exists executive_risk_case_ack_idx on public.executive_risk_cases(company_id, acknowledgment_due_at);
create index if not exists executive_escalation_scope_idx on public.executive_escalations(company_id, site_id, escalation_status, escalation_level);
create index if not exists executive_escalation_sla_idx on public.executive_escalations(company_id, response_due_at, acknowledgment_due_at);
create index if not exists executive_overdue_action_idx on public.executive_overdue_action_snapshots(company_id, site_id, overdue_days, action_status);
create index if not exists executive_risk_history_idx on public.executive_risk_history_events(company_id, risk_case_id, created_at desc);

do $$ declare permission_key text; begin
  foreach permission_key in array array[
    'executive.critical_risk.dashboard.view','executive.critical_risk.register.view','executive.critical_risk.detail.view','executive.critical_risk.source_trace.view','executive.critical_risk.recalculate','executive.critical_risk.acknowledge','executive.critical_risk.owner.assign','executive.critical_risk.action.link','executive.critical_risk.action.create','executive.critical_risk.escalate','executive.critical_risk.management_note.create','executive.critical_risk.verification.request','executive.critical_risk.case.close','executive.critical_risk.history.view','executive.overdue_action.dashboard.view','executive.overdue_action.register.view','executive.overdue_action.detail.view','executive.overdue_action.owner.view','executive.overdue_action.escalate','executive.overdue_action.followup.request','executive.overdue_action.source_trace.view','executive.escalation.dashboard.view','executive.escalation.register.view','executive.escalation.create','executive.escalation.acknowledge','executive.escalation.respond','executive.escalation.reassign','executive.escalation.level.increase','executive.escalation.decision.create','executive.escalation.close','executive.escalation.cancel','executive.escalation.history.view','executive.escalation.rule.view','executive.escalation.rule.create','executive.escalation.rule.edit','executive.escalation.rule.approve','executive.escalation.rule.archive','executive.leadership_attention.view','executive.leadership_attention.acknowledge','executive.leadership_attention.decision.create','executive.leadership_attention.management_review.link','executive.critical_risk.restricted.view','executive.escalation.restricted.view','executive.critical_risk.restricted.source_trace.view'
  ] loop
    insert into public."Permission" ("id","tenantId","key","moduleKey","label")
    select gen_random_uuid()::text,t."id",permission_key,'EXECUTIVE',permission_key from public."Tenant" t
    where not exists (select 1 from public."Permission" p where p."tenantId"=t."id" and p."key"=permission_key);
  end loop;
end $$;

alter table public.executive_risk_priority_policy_versions enable row level security;
alter table public.executive_risk_cases enable row level security;
alter table public.executive_risk_case_source_links enable row level security;
alter table public.executive_risk_case_action_links enable row level security;
alter table public.executive_risk_case_ownership_history enable row level security;
alter table public.executive_escalation_rules enable row level security;
alter table public.executive_escalations enable row level security;
alter table public.executive_escalation_events enable row level security;
alter table public.executive_risk_case_acknowledgments enable row level security;
alter table public.executive_management_decisions enable row level security;
alter table public.executive_risk_verification_records enable row level security;
alter table public.executive_overdue_action_snapshots enable row level security;
alter table public.executive_risk_aggregation_runs enable row level security;
alter table public.executive_risk_history_events enable row level security;
