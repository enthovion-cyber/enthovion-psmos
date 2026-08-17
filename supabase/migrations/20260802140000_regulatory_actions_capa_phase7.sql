alter table public.regulatory_settings
  add column if not exists require_action_for_non_compliance boolean default true,
  add column if not exists require_action_for_critical_gap boolean default true,
  add column if not exists require_action_for_evidence_gap boolean default true,
  add column if not exists require_action_for_audit_mapping_gap boolean default false,
  add column if not exists require_owner_for_regulatory_action boolean default true,
  add column if not exists require_due_date_for_regulatory_action boolean default true,
  add column if not exists require_verification_for_critical_action boolean default true,
  add column if not exists require_effectiveness_for_critical_action boolean default false,
  add column if not exists allow_link_existing_action boolean default true,
  add column if not exists allow_link_audit_capa boolean default true,
  add column if not exists allow_manual_action_placeholder_foundation boolean default false,
  add column if not exists allow_gap_closure_without_action boolean default false,
  add column if not exists allow_gap_closure_with_waiver boolean default true,
  add column if not exists require_reason_for_action_waiver boolean default true,
  add column if not exists auto_create_action_for_critical_non_compliance boolean default false,
  add column if not exists auto_sync_universal_action_status boolean default true,
  add column if not exists auto_sync_audit_capa_status boolean default true,
  add column if not exists auto_update_gap_readiness_on_action_change boolean default true,
  add column if not exists auto_update_compliance_readiness_on_action_change boolean default true,
  add column if not exists auto_notify_owner_on_action_due_soon boolean default true,
  add column if not exists auto_notify_owner_on_action_overdue boolean default true,
  add column if not exists auto_notify_owner_on_verification_failed boolean default true,
  add column if not exists action_due_soon_days integer default 14,
  add column if not exists action_overdue_escalation_days integer default 7;

create table if not exists public.regulatory_action_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  department_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  action_link_code text null,
  action_link_title text not null,
  source_type text not null,
  regulatory_item_id text null references public.regulatory_register_items(id) on delete set null,
  obligation_id text null references public.regulatory_obligations(id) on delete set null,
  applicability_gap_id text null references public.regulatory_applicability_gaps(id) on delete set null,
  obligation_gap_id text null references public.regulatory_obligation_gaps(id) on delete set null,
  compliance_gap_id text null references public.regulatory_compliance_gaps(id) on delete set null,
  evidence_gap_id text null references public.regulatory_evidence_gaps(id) on delete set null,
  audit_mapping_gap_id text null references public.regulatory_audit_mapping_gaps(id) on delete set null,
  compliance_assessment_id text null references public.regulatory_compliance_assessments(id) on delete set null,
  evidence_link_id text null references public.regulatory_evidence_links(id) on delete set null,
  audit_mapping_id text null references public.regulatory_audit_mappings(id) on delete set null,
  source_snapshot_json jsonb null,
  action_mode text not null,
  regulatory_action_type text not null,
  action_classification text null,
  universal_action_id text null,
  audit_capa_id text null,
  audit_capa_action_id text null,
  capa_package_id text null,
  action_status text not null default 'Action Not Started',
  action_priority text not null default 'Medium',
  sync_status text not null default 'Not Synced',
  closure_readiness_status text not null default 'Not Ready',
  verification_status text not null default 'Not Required',
  effectiveness_status text not null default 'Not Required',
  stale_status text not null default 'Current',
  stale_reason text null,
  compliance_impact text null,
  criticality text null,
  owner_user_id text null,
  responsible_department_id text null,
  reviewer_user_id text null,
  verifier_user_id text null,
  due_date timestamptz null,
  completed_at timestamptz null,
  verified_at timestamptz null,
  effectiveness_due_date timestamptz null,
  evidence_required boolean not null default false,
  verification_required boolean not null default false,
  effectiveness_required boolean not null default false,
  acceptance_criteria_foundation text null,
  root_cause_foundation text null,
  expected_outcome text null,
  action_reason text null,
  linked_by text null,
  linked_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.regulatory_capa_packages (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  department_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  capa_package_code text null,
  capa_package_title text not null,
  capa_package_type text not null,
  package_status text not null default 'Open',
  closure_readiness_status text not null default 'Not Ready',
  verification_status text not null default 'Not Required',
  effectiveness_status text not null default 'Not Required',
  criticality text null,
  owner_user_id text null,
  reviewer_user_id text null,
  verifier_user_id text null,
  linked_audit_capa_id text null,
  source_summary_json jsonb null,
  action_summary_json jsonb null,
  readiness_trace_json jsonb null,
  evidence_required boolean not null default false,
  verification_required boolean not null default false,
  effectiveness_required boolean not null default false,
  due_date timestamptz null,
  effectiveness_due_date timestamptz null,
  closed_by text null,
  closed_at timestamptz null,
  closure_note text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'regulatory_action_links_capa_package_id_fkey'
      and conrelid = 'public.regulatory_action_links'::regclass
  ) then
    alter table public.regulatory_action_links
      add constraint regulatory_action_links_capa_package_id_fkey
      foreign key (capa_package_id) references public.regulatory_capa_packages(id) on delete set null;
  end if;
end $$;

create table if not exists public.regulatory_capa_package_sources (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  capa_package_id text not null references public.regulatory_capa_packages(id) on delete cascade,
  source_type text not null,
  regulatory_item_id text null,
  obligation_id text null,
  applicability_gap_id text null,
  obligation_gap_id text null,
  compliance_gap_id text null,
  evidence_gap_id text null,
  audit_mapping_gap_id text null,
  source_snapshot_json jsonb null,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_capa_package_actions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  capa_package_id text not null references public.regulatory_capa_packages(id) on delete cascade,
  action_link_id text not null references public.regulatory_action_links(id) on delete cascade,
  universal_action_id text null,
  audit_capa_action_id text null,
  action_role text not null default 'Corrective Action',
  action_status text not null default 'Action Not Started',
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.regulatory_action_closure_readiness (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  action_link_id text null references public.regulatory_action_links(id) on delete cascade,
  capa_package_id text null references public.regulatory_capa_packages(id) on delete cascade,
  source_type text not null,
  source_record_id text not null,
  readiness_status text not null,
  readiness_trace_json jsonb not null default '{}'::jsonb,
  blocking_reasons_json jsonb null,
  checked_by text null,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_action_verification_foundation (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  action_link_id text null references public.regulatory_action_links(id) on delete cascade,
  capa_package_id text null references public.regulatory_capa_packages(id) on delete cascade,
  verification_status text not null,
  verification_comment text null,
  verification_basis_foundation text null,
  verified_by text null,
  verified_at timestamptz null,
  failed_reason text null,
  evidence_link_id text null,
  e_signature_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_action_effectiveness_foundation (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  action_link_id text null references public.regulatory_action_links(id) on delete cascade,
  capa_package_id text null references public.regulatory_capa_packages(id) on delete cascade,
  effectiveness_status text not null,
  effectiveness_due_date timestamptz null,
  effectiveness_comment text null,
  effectiveness_basis_foundation text null,
  checked_by text null,
  checked_at timestamptz null,
  failed_reason text null,
  next_check_date timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_action_sync_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  action_link_id text null references public.regulatory_action_links(id) on delete cascade,
  capa_package_id text null references public.regulatory_capa_packages(id) on delete cascade,
  sync_source text not null,
  sync_event_type text not null,
  sync_status text not null,
  old_action_status text null,
  new_action_status text null,
  old_readiness_status text null,
  new_readiness_status text null,
  source_snapshot_json jsonb null,
  error_message text null,
  synced_by text null,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_action_escalations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  action_link_id text null references public.regulatory_action_links(id) on delete cascade,
  capa_package_id text null references public.regulatory_capa_packages(id) on delete cascade,
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

create table if not exists public.regulatory_action_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  action_link_id text null,
  capa_package_id text null,
  regulatory_item_id text null,
  obligation_id text null,
  source_type text null,
  source_record_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'Regulatory Actions / CAPA',
  created_at timestamptz not null default now()
);

create index if not exists regulatory_action_links_company_site_status_idx on public.regulatory_action_links(company_id, site_id, action_status);
create index if not exists regulatory_action_links_company_site_sync_idx on public.regulatory_action_links(company_id, site_id, sync_status);
create index if not exists regulatory_action_links_company_site_readiness_idx on public.regulatory_action_links(company_id, site_id, closure_readiness_status);
create index if not exists regulatory_action_links_regulatory_item_idx on public.regulatory_action_links(regulatory_item_id);
create index if not exists regulatory_action_links_obligation_idx on public.regulatory_action_links(obligation_id);
create index if not exists regulatory_action_links_compliance_gap_idx on public.regulatory_action_links(compliance_gap_id);
create index if not exists regulatory_action_links_evidence_gap_idx on public.regulatory_action_links(evidence_gap_id);
create index if not exists regulatory_action_links_audit_mapping_gap_idx on public.regulatory_action_links(audit_mapping_gap_id);
create index if not exists regulatory_action_links_universal_action_idx on public.regulatory_action_links(universal_action_id);
create index if not exists regulatory_action_links_audit_capa_idx on public.regulatory_action_links(audit_capa_id);
create index if not exists regulatory_action_links_owner_idx on public.regulatory_action_links(owner_user_id);
create index if not exists regulatory_action_links_due_date_idx on public.regulatory_action_links(due_date);
create index if not exists regulatory_capa_packages_company_site_status_idx on public.regulatory_capa_packages(company_id, site_id, package_status);
create index if not exists regulatory_capa_package_sources_package_type_idx on public.regulatory_capa_package_sources(capa_package_id, source_type);
create index if not exists regulatory_capa_package_actions_package_link_idx on public.regulatory_capa_package_actions(capa_package_id, action_link_id);
create index if not exists regulatory_action_closure_readiness_link_checked_idx on public.regulatory_action_closure_readiness(action_link_id, checked_at desc);
create index if not exists regulatory_action_sync_events_link_synced_idx on public.regulatory_action_sync_events(action_link_id, synced_at desc);
create index if not exists regulatory_action_history_events_link_created_idx on public.regulatory_action_history_events(action_link_id, created_at desc);
create index if not exists regulatory_action_history_events_package_created_idx on public.regulatory_action_history_events(capa_package_id, created_at desc);

alter table public.regulatory_action_links enable row level security;
alter table public.regulatory_capa_packages enable row level security;
alter table public.regulatory_capa_package_sources enable row level security;
alter table public.regulatory_capa_package_actions enable row level security;
alter table public.regulatory_action_closure_readiness enable row level security;
alter table public.regulatory_action_verification_foundation enable row level security;
alter table public.regulatory_action_effectiveness_foundation enable row level security;
alter table public.regulatory_action_sync_events enable row level security;
alter table public.regulatory_action_escalations enable row level security;
alter table public.regulatory_action_history_events enable row level security;

grant select, insert, update, delete on public.regulatory_action_links to authenticated;
grant select, insert, update, delete on public.regulatory_capa_packages to authenticated;
grant select, insert, update, delete on public.regulatory_capa_package_sources to authenticated;
grant select, insert, update, delete on public.regulatory_capa_package_actions to authenticated;
grant select, insert, update, delete on public.regulatory_action_closure_readiness to authenticated;
grant select, insert, update, delete on public.regulatory_action_verification_foundation to authenticated;
grant select, insert, update, delete on public.regulatory_action_effectiveness_foundation to authenticated;
grant select, insert, update, delete on public.regulatory_action_sync_events to authenticated;
grant select, insert, update, delete on public.regulatory_action_escalations to authenticated;
grant select on public.regulatory_action_history_events to authenticated;
grant insert on public.regulatory_action_history_events to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_action_links',
    'regulatory_capa_packages',
    'regulatory_capa_package_sources',
    'regulatory_capa_package_actions',
    'regulatory_action_closure_readiness',
    'regulatory_action_verification_foundation',
    'regulatory_action_effectiveness_foundation',
    'regulatory_action_sync_events',
    'regulatory_action_escalations',
    'regulatory_action_history_events'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_scope_select', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_scope_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scope_insert', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_scope_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scope_update', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.regulatory_company_site_visible(company_id, site_id)) with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_scope_update', table_name);
    if table_name <> 'regulatory_action_history_events' then
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
    'regulatory.action.view',
    'regulatory.action.dashboard.view',
    'regulatory.action.register.view',
    'regulatory.action.create',
    'regulatory.action.link_existing',
    'regulatory.action.link_audit_capa',
    'regulatory.action.edit_link',
    'regulatory.action.archive_link',
    'regulatory.action.sync',
    'regulatory.action.refresh_snapshot',
    'regulatory.action.escalate',
    'regulatory.action.open_universal_action',
    'regulatory.action.closure_readiness.view',
    'regulatory.action.closure_readiness.check',
    'regulatory.action.verification.view',
    'regulatory.action.verification.submit',
    'regulatory.action.verification.fail',
    'regulatory.action.effectiveness.view',
    'regulatory.action.effectiveness.submit',
    'regulatory.capa.view',
    'regulatory.capa.create',
    'regulatory.capa.edit',
    'regulatory.capa.archive',
    'regulatory.capa.add_source',
    'regulatory.capa.add_action',
    'regulatory.capa.close_foundation',
    'regulatory.capa.reopen',
    'regulatory.action.sync_log.view',
    'regulatory.action.history.view',
    'regulatory.action.settings.edit'
  ]
  loop
    for tenant_row in select id from public."Tenant" loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'REGULATORY', initcap(replace(permission_key, '.', ' '))
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
