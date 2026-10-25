alter table public.regulatory_settings
  add column if not exists require_review_for_active_regulatory_item boolean default false,
  add column if not exists require_review_for_applicability_decision boolean default true,
  add column if not exists require_review_for_critical_applicability_decision boolean default true,
  add column if not exists require_review_for_critical_obligation boolean default true,
  add column if not exists require_review_for_compliance_status_change boolean default true,
  add column if not exists require_review_for_critical_compliance_status boolean default true,
  add column if not exists require_review_for_non_compliance_closure boolean default true,
  add column if not exists require_review_for_evidence_verification boolean default false,
  add column if not exists require_review_for_critical_evidence_verification boolean default true,
  add column if not exists require_review_for_audit_mapping_verification boolean default true,
  add column if not exists require_review_for_regulatory_capa_closure boolean default true,
  add column if not exists require_esign_for_critical_approval boolean default true,
  add column if not exists require_esign_for_compliance_status_approval boolean default true,
  add column if not exists require_separation_of_duties boolean default true,
  add column if not exists block_approval_if_package_stale boolean default true,
  add column if not exists block_approval_if_validation_failed boolean default true,
  add column if not exists auto_lock_source_after_final_approval boolean default true,
  add column if not exists allow_approval_with_conditions boolean default true,
  add column if not exists allow_delegate_review boolean default true,
  add column if not exists allow_review_escalation boolean default true,
  add column if not exists review_due_soon_days integer default 7,
  add column if not exists review_overdue_escalation_days integer default 3;

create table if not exists public.regulatory_review_packages (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  package_code text null,
  package_title text not null,
  package_description text null,
  source_type text not null,
  source_record_id text not null,
  source_record_number text null,
  regulatory_item_id text null references public.regulatory_register_items(id) on delete set null,
  obligation_id text null references public.regulatory_obligations(id) on delete set null,
  applicability_assessment_id text null references public.regulatory_applicability_assessments(id) on delete set null,
  compliance_assessment_id text null references public.regulatory_compliance_assessments(id) on delete set null,
  evidence_link_id text null references public.regulatory_evidence_links(id) on delete set null,
  evidence_package_id text null references public.regulatory_evidence_package_foundations(id) on delete set null,
  audit_mapping_id text null references public.regulatory_audit_mappings(id) on delete set null,
  action_link_id text null references public.regulatory_action_links(id) on delete set null,
  capa_package_id text null references public.regulatory_capa_packages(id) on delete set null,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Not Run',
  validation_summary_json jsonb null,
  review_status text not null default 'Draft',
  current_stage_id text null,
  current_reviewer_user_id text null,
  decision text null,
  criticality text null,
  e_signature_required boolean not null default false,
  e_signature_status text not null default 'Not Required',
  stale_status text not null default 'Current',
  stale_reason text null,
  source_locked boolean not null default false,
  source_locked_at timestamptz null,
  review_rule_id text null,
  submitted_by text null,
  submitted_at timestamptz null,
  due_date timestamptz null,
  completed_at timestamptz null,
  cancelled_by text null,
  cancelled_at timestamptz null,
  cancel_reason text null,
  open_condition_count integer not null default 0,
  overdue_condition_count integer not null default 0,
  escalation_status text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_review_stages (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_id text not null references public.regulatory_review_packages(id) on delete cascade,
  stage_number integer not null,
  stage_title text not null,
  stage_status text not null default 'Not Started',
  reviewer_user_id text null,
  reviewer_role_id text null,
  required_permission text null,
  due_date timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  delegated_to_user_id text null,
  escalation_status text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_decisions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_id text not null references public.regulatory_review_packages(id) on delete cascade,
  stage_id text null references public.regulatory_review_stages(id) on delete set null,
  decision text not null,
  decision_comment text null,
  decision_reason text null,
  decided_by text null,
  decided_at timestamptz not null default now(),
  e_signature_required boolean not null default false,
  e_signature_id text null,
  e_signature_status text null,
  validation_override boolean not null default false,
  validation_override_reason text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_conditions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_id text not null references public.regulatory_review_packages(id) on delete cascade,
  decision_id text null references public.regulatory_review_decisions(id) on delete set null,
  condition_title text not null,
  condition_description text null,
  condition_status text not null default 'Open',
  owner_user_id text null,
  due_date timestamptz null,
  evidence_required_foundation boolean not null default false,
  action_required_foundation boolean not null default false,
  verification_required_foundation boolean not null default false,
  action_id text null,
  evidence_link_id text null,
  closure_note text null,
  closed_by text null,
  closed_at timestamptz null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_validation_results (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_id text not null references public.regulatory_review_packages(id) on delete cascade,
  validation_key text not null,
  validation_title text not null,
  validation_status text not null,
  validation_message text null,
  severity text not null default 'Medium',
  blocking boolean not null default false,
  source_module text not null,
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_rules (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  rule_code text null,
  rule_title text not null,
  source_type text not null,
  trigger_event text not null,
  scope_json jsonb null,
  applicable_criticalities_json jsonb null,
  applicable_categories_json jsonb null,
  applicable_psm_elements_json jsonb null,
  reviewer_selection_method text not null,
  required_role_id text null,
  required_permission text null,
  specific_reviewer_user_id text null,
  reviewer_group_foundation text null,
  e_signature_required boolean not null default false,
  separation_of_duties_required boolean not null default true,
  sla_days integer null,
  escalation_rule_foundation_json jsonb null,
  auto_lock_source_after_approval boolean not null default true,
  auto_mark_compliance_ready_after_approval boolean not null default false,
  rule_status text not null default 'Active',
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_review_rule_stages (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  rule_id text not null references public.regulatory_review_rules(id) on delete cascade,
  stage_number integer not null,
  stage_title text not null,
  reviewer_selection_method text not null,
  required_role_id text null,
  required_permission text null,
  specific_reviewer_user_id text null,
  e_signature_required boolean not null default false,
  sla_days integer null,
  escalation_rule_foundation_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_esignature_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_id text not null references public.regulatory_review_packages(id) on delete cascade,
  decision_id text null references public.regulatory_review_decisions(id) on delete set null,
  stage_id text null references public.regulatory_review_stages(id) on delete set null,
  e_signature_id text not null,
  signer_user_id text null,
  signature_status text not null default 'Pending',
  signature_meaning text null,
  signature_reason text null,
  signed_at timestamptz null,
  failed_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_escalations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_id text not null references public.regulatory_review_packages(id) on delete cascade,
  stage_id text null references public.regulatory_review_stages(id) on delete set null,
  escalation_type text not null,
  escalation_status text not null default 'Open',
  escalation_reason text not null,
  escalated_to_user_id text null,
  escalated_by text null,
  escalated_at timestamptz not null default now(),
  resolved_by text null,
  resolved_at timestamptz null,
  resolution_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_staleness_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_id text not null references public.regulatory_review_packages(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text not null,
  source_record_id text null,
  stale_reason text not null,
  detected_at timestamptz not null default now(),
  resolved_by text null,
  resolved_at timestamptz null,
  resolution_note text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_review_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  package_id text null references public.regulatory_review_packages(id) on delete set null,
  source_type text null,
  source_record_id text null,
  regulatory_item_id text null,
  obligation_id text null,
  decision_id text null,
  condition_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'Regulatory Review & Approval',
  audit_log_id text null,
  created_at timestamptz not null default now()
);

create index if not exists regulatory_review_packages_company_site_status_idx on public.regulatory_review_packages(company_id, site_id, review_status);
create index if not exists regulatory_review_packages_company_site_source_idx on public.regulatory_review_packages(company_id, site_id, source_type);
create index if not exists regulatory_review_packages_reviewer_idx on public.regulatory_review_packages(current_reviewer_user_id);
create index if not exists regulatory_review_packages_submitter_idx on public.regulatory_review_packages(submitted_by);
create index if not exists regulatory_review_packages_due_date_idx on public.regulatory_review_packages(due_date);
create index if not exists regulatory_review_packages_stale_idx on public.regulatory_review_packages(stale_status);
create index if not exists regulatory_review_stages_package_stage_idx on public.regulatory_review_stages(package_id, stage_number);
create index if not exists regulatory_review_decisions_package_decided_idx on public.regulatory_review_decisions(package_id, decided_at);
create index if not exists regulatory_review_conditions_package_status_idx on public.regulatory_review_conditions(package_id, condition_status);
create index if not exists regulatory_review_validation_package_status_idx on public.regulatory_review_validation_results(package_id, validation_status);
create index if not exists regulatory_review_rules_scope_idx on public.regulatory_review_rules(company_id, site_id, source_type, rule_status);
create index if not exists regulatory_review_esign_package_status_idx on public.regulatory_review_esignature_links(package_id, signature_status);
create index if not exists regulatory_review_history_package_created_idx on public.regulatory_review_history_events(package_id, created_at);

grant select, insert, update, delete on public.regulatory_review_packages to authenticated;
grant select, insert, update, delete on public.regulatory_review_stages to authenticated;
grant select, insert, update, delete on public.regulatory_review_decisions to authenticated;
grant select, insert, update, delete on public.regulatory_review_conditions to authenticated;
grant select, insert, update, delete on public.regulatory_review_validation_results to authenticated;
grant select, insert, update, delete on public.regulatory_review_rules to authenticated;
grant select, insert, update, delete on public.regulatory_review_rule_stages to authenticated;
grant select, insert, update, delete on public.regulatory_review_esignature_links to authenticated;
grant select, insert, update, delete on public.regulatory_review_escalations to authenticated;
grant select, insert, update, delete on public.regulatory_review_staleness_events to authenticated;
grant select on public.regulatory_review_history_events to authenticated;
grant insert on public.regulatory_review_history_events to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_review_packages',
    'regulatory_review_stages',
    'regulatory_review_decisions',
    'regulatory_review_conditions',
    'regulatory_review_validation_results',
    'regulatory_review_rules',
    'regulatory_review_rule_stages',
    'regulatory_review_esignature_links',
    'regulatory_review_escalations',
    'regulatory_review_staleness_events',
    'regulatory_review_history_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scope_select', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_scope_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scope_insert', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_scope_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scope_update', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.regulatory_company_site_visible(company_id, site_id)) with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_scope_update', table_name);
    if table_name <> 'regulatory_review_history_events' then
      execute format('drop policy if exists %I on public.%I', table_name || '_scope_delete', table_name);
      execute format('create policy %I on public.%I for delete to authenticated using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_scope_delete', table_name);
    end if;
  end loop;
end $$;

do $$
declare
  tenant_row record;
  permission_key text;
begin
  foreach permission_key in array array[
    'regulatory.review.view',
    'regulatory.review.dashboard.view',
    'regulatory.review.inbox.view',
    'regulatory.review.submission.view',
    'regulatory.review.package.view',
    'regulatory.review.package.create',
    'regulatory.review.package.submit',
    'regulatory.review.package.cancel',
    'regulatory.review.package.resubmit',
    'regulatory.review.package.refresh_snapshot',
    'regulatory.review.package.mark_stale',
    'regulatory.review.package.archive',
    'regulatory.review.validation.view',
    'regulatory.review.validation.run',
    'regulatory.review.decision.approve',
    'regulatory.review.decision.approve_with_conditions',
    'regulatory.review.decision.reject',
    'regulatory.review.decision.return',
    'regulatory.review.decision.request_info',
    'regulatory.review.decision.override_validation',
    'regulatory.review.decision.delegate',
    'regulatory.review.decision.escalate',
    'regulatory.review.esign.view',
    'regulatory.review.esign.sign',
    'regulatory.review.condition.view',
    'regulatory.review.condition.create',
    'regulatory.review.condition.edit',
    'regulatory.review.condition.close',
    'regulatory.review.rule.view',
    'regulatory.review.rule.create',
    'regulatory.review.rule.edit',
    'regulatory.review.rule.archive',
    'regulatory.review.source.lock',
    'regulatory.review.source.reopen',
    'regulatory.review.history.view',
    'regulatory.review.settings.edit'
  ]
  loop
    for tenant_row in select id from public."Tenant" loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'Regulatory', initcap(replace(permission_key, '.', ' '))
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
