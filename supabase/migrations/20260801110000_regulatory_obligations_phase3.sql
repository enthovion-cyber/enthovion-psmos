alter table public.regulatory_settings
  add column if not exists require_obligation_breakdown_for_applicable_item boolean not null default false,
  add column if not exists require_owner_for_active_obligation boolean not null default true,
  add column if not exists require_scope_for_active_obligation boolean not null default true,
  add column if not exists require_frequency_for_active_obligation boolean not null default false,
  add column if not exists require_due_date_or_trigger_for_active_obligation boolean not null default false,
  add column if not exists require_evidence_expectation_for_critical_obligation boolean not null default true,
  add column if not exists require_module_mapping_for_psm_critical_obligation boolean not null default true,
  add column if not exists require_risk_basis_for_critical_obligation boolean not null default true,
  add column if not exists require_rationale_for_obligation_not_applicable boolean not null default true,
  add column if not exists auto_create_gap_for_missing_obligation_owner boolean not null default true,
  add column if not exists auto_create_gap_for_missing_evidence_expectation boolean not null default true,
  add column if not exists auto_create_gap_for_missing_module_mapping boolean not null default true,
  add column if not exists auto_mark_obligation_stale_on_parent_change boolean not null default true,
  add column if not exists auto_notify_owner_obligation_due_soon boolean not null default true,
  add column if not exists auto_notify_owner_obligation_overdue boolean not null default true,
  add column if not exists obligation_due_soon_days integer not null default 30;

create table if not exists public.regulatory_obligations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  department_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  jurisdiction_id text references public.regulatory_jurisdictions(id),
  authority_id text references public.regulatory_authorities(id),
  parent_obligation_id text references public.regulatory_obligations(id),
  obligation_code text not null,
  obligation_title text not null,
  obligation_type text not null default 'Regulatory Obligation',
  obligation_reference text,
  short_summary text,
  requirement_summary text,
  version text,
  effective_date timestamptz,
  expiry_date timestamptz,
  supersedes_obligation_id text references public.regulatory_obligations(id),
  superseded_by_obligation_id text references public.regulatory_obligations(id),
  obligation_status text not null default 'Draft',
  applicability_status text not null default 'Inherited From Parent',
  compliance_status text not null default 'Not Assessed',
  evidence_expectation_status text not null default 'Evidence Expectation Missing',
  module_mapping_status text not null default 'Not Mapped',
  stale_status text not null default 'Current',
  stale_reason text,
  category text not null default 'Custom',
  topic text,
  related_psm_element text,
  related_module text,
  criticality text not null default 'Medium',
  risk_basis text,
  regulatory_impact text,
  safety_impact text,
  environmental_impact text,
  business_impact text,
  frequency text,
  due_date timestamptz,
  start_date timestamptz,
  next_due_date timestamptz,
  last_completed_date timestamptz,
  trigger_event text,
  recurrence_rule_json jsonb,
  grace_period_days integer,
  owner_user_id text,
  compliance_owner_user_id text,
  site_owner_user_id text,
  reviewer_user_id text,
  responsible_department_id text,
  review_frequency text,
  next_review_date timestamptz,
  last_review_date timestamptz,
  evidence_required boolean not null default false,
  action_required_foundation boolean not null default false,
  capa_required_foundation boolean not null default false,
  status_rationale text,
  applicability_rationale text,
  scope_change_reason text,
  notes text,
  linked_audit_count integer not null default 0,
  linked_evidence_count integer not null default 0,
  linked_action_count integer not null default 0,
  locked boolean not null default false,
  locked_by text,
  locked_at timestamptz,
  lock_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint regulatory_obligations_code_scope_unique unique(company_id, obligation_code)
);

create table if not exists public.regulatory_obligation_scopes (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  obligation_id text not null references public.regulatory_obligations(id) on delete cascade,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  scope_type text not null,
  scope_record_id text not null,
  scope_label text,
  inherited_from_parent boolean not null default false,
  included boolean not null default true,
  applicability_status text,
  applicability_rationale text,
  exclusion_reason text,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_obligation_evidence_expectations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  obligation_id text not null references public.regulatory_obligations(id) on delete cascade,
  evidence_required boolean not null default true,
  evidence_type_expected text,
  evidence_description text,
  evidence_frequency text,
  evidence_owner_user_id text,
  required_document_type text,
  required_record_type text,
  evidence_source_module text,
  acceptance_criteria_foundation text,
  retention_requirement_foundation text,
  expectation_status text not null default 'Evidence Required',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text
);

create table if not exists public.regulatory_obligation_module_mappings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  obligation_id text not null references public.regulatory_obligations(id) on delete cascade,
  module_key text not null,
  module_record_id text,
  mapping_status text not null default 'Mapped To Module',
  mapping_rationale text,
  control_safeguard_mapping_foundation text,
  responsible_module_owner_user_id text,
  source_snapshot_json jsonb,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_obligation_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  obligation_id text not null references public.regulatory_obligations(id) on delete cascade,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  linked_module text not null,
  linked_object_type text not null,
  linked_record_id text not null,
  link_role text not null default 'Foundation Link',
  link_status text not null default 'Active',
  source_snapshot_json jsonb,
  link_reason text,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_obligation_status_history (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  obligation_id text not null references public.regulatory_obligations(id) on delete cascade,
  status_type text not null,
  old_status text,
  new_status text not null,
  status_reason text,
  changed_by text,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_obligation_gaps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  jurisdiction_id text references public.regulatory_jurisdictions(id),
  gap_type text not null,
  gap_title text not null,
  gap_description text,
  gap_status text not null default 'Open',
  severity text not null default 'Medium',
  criticality text,
  owner_user_id text,
  due_date timestamptz,
  recommended_fix text,
  action_id text,
  waiver_reason text,
  detected_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_obligation_staleness_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  obligation_id text not null references public.regulatory_obligations(id) on delete cascade,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text not null,
  source_record_id text,
  stale_reason text not null,
  detected_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_obligation_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  regulatory_item_id text references public.regulatory_register_items(id) on delete set null,
  obligation_id text references public.regulatory_obligations(id) on delete set null,
  jurisdiction_id text references public.regulatory_jurisdictions(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'Regulatory Register',
  source_record_id text,
  created_at timestamptz not null default now()
);

alter table public.regulatory_obligations enable row level security;
alter table public.regulatory_obligation_scopes enable row level security;
alter table public.regulatory_obligation_evidence_expectations enable row level security;
alter table public.regulatory_obligation_module_mappings enable row level security;
alter table public.regulatory_obligation_links enable row level security;
alter table public.regulatory_obligation_status_history enable row level security;
alter table public.regulatory_obligation_gaps enable row level security;
alter table public.regulatory_obligation_staleness_events enable row level security;
alter table public.regulatory_obligation_history_events enable row level security;

grant select, insert, update, delete on public.regulatory_obligations to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_scopes to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_evidence_expectations to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_module_mappings to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_links to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_status_history to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_gaps to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_staleness_events to authenticated;
grant select, insert, update, delete on public.regulatory_obligation_history_events to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_obligations',
    'regulatory_obligation_scopes',
    'regulatory_obligation_evidence_expectations',
    'regulatory_obligation_module_mappings',
    'regulatory_obligation_links',
    'regulatory_obligation_status_history',
    'regulatory_obligation_gaps',
    'regulatory_obligation_staleness_events',
    'regulatory_obligation_history_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_company_site', table_name);
    execute format('create policy %I on public.%I for select using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_select_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_company_site', table_name);
    execute format('create policy %I on public.%I for insert with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_insert_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_company_site', table_name);
    execute format('create policy %I on public.%I for update using (public.regulatory_company_site_visible(company_id, site_id)) with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_update_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_company_site', table_name);
    execute format('create policy %I on public.%I for delete using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_delete_company_site', table_name);
  end loop;
end $$;

create index if not exists regulatory_obligations_status_idx on public.regulatory_obligations(company_id, site_id, obligation_status);
create index if not exists regulatory_obligations_applicability_idx on public.regulatory_obligations(company_id, site_id, applicability_status);
create index if not exists regulatory_obligations_compliance_idx on public.regulatory_obligations(company_id, site_id, compliance_status);
create index if not exists regulatory_obligations_criticality_idx on public.regulatory_obligations(company_id, site_id, criticality);
create index if not exists regulatory_obligations_item_idx on public.regulatory_obligations(regulatory_item_id);
create index if not exists regulatory_obligations_jurisdiction_idx on public.regulatory_obligations(jurisdiction_id);
create index if not exists regulatory_obligations_owner_idx on public.regulatory_obligations(owner_user_id);
create index if not exists regulatory_obligations_due_idx on public.regulatory_obligations(due_date);
create index if not exists regulatory_obligations_next_due_idx on public.regulatory_obligations(next_due_date);
create index if not exists regulatory_obligations_next_review_idx on public.regulatory_obligations(next_review_date);
create index if not exists regulatory_obligations_code_idx on public.regulatory_obligations(obligation_code);
create index if not exists regulatory_obligation_scopes_record_idx on public.regulatory_obligation_scopes(obligation_id, scope_type, scope_record_id) where removed_at is null;
create index if not exists regulatory_obligation_evidence_status_idx on public.regulatory_obligation_evidence_expectations(obligation_id, expectation_status) where archived_at is null;
create index if not exists regulatory_obligation_module_mapping_idx on public.regulatory_obligation_module_mappings(obligation_id, module_key) where removed_at is null;
create index if not exists regulatory_obligation_links_record_idx on public.regulatory_obligation_links(obligation_id, linked_module, linked_record_id) where removed_at is null;
create index if not exists regulatory_obligation_gaps_scope_idx on public.regulatory_obligation_gaps(company_id, site_id, gap_status);
create index if not exists regulatory_obligation_history_idx on public.regulatory_obligation_history_events(obligation_id, created_at desc);

do $$
declare
  permission_key text;
  permission_label text;
  tenant_row record;
  permission_keys text[] := array[
    'regulatory.obligation.view',
    'regulatory.obligation.dashboard.view',
    'regulatory.obligation.register.view',
    'regulatory.obligation.matrix.view',
    'regulatory.obligation.create',
    'regulatory.obligation.edit',
    'regulatory.obligation.archive',
    'regulatory.obligation.reactivate',
    'regulatory.obligation.lock',
    'regulatory.obligation.unlock',
    'regulatory.obligation.assign_owner',
    'regulatory.obligation.change_status',
    'regulatory.obligation.change_applicability',
    'regulatory.obligation.change_compliance_status',
    'regulatory.obligation.scope.view',
    'regulatory.obligation.scope.manage',
    'regulatory.obligation.evidence_expectation.view',
    'regulatory.obligation.evidence_expectation.manage',
    'regulatory.obligation.module_mapping.view',
    'regulatory.obligation.module_mapping.manage',
    'regulatory.obligation.link.view',
    'regulatory.obligation.link.manage',
    'regulatory.obligation.gap.view',
    'regulatory.obligation.gap.manage',
    'regulatory.obligation.stale.view',
    'regulatory.obligation.history.view',
    'regulatory.obligation.settings.edit'
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_key in array permission_keys loop
      permission_label := initcap(replace(replace(permission_key, 'regulatory.', ''), '_', ' '));
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'regulatory', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
