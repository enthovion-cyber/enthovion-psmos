alter table public.lopa_consequences
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists endpoint text,
  add column if not exists impact_type text,
  add column if not exists credible_worst_case text,
  add column if not exists most_likely_consequence text,
  add column if not exists consequence_basis text,
  add column if not exists consequence_source_reference text,
  add column if not exists personnel_impact boolean not null default false,
  add column if not exists environmental_impact boolean not null default false,
  add column if not exists asset_impact boolean not null default false,
  add column if not exists community_impact boolean not null default false,
  add column if not exists regulatory_impact boolean not null default false,
  add column if not exists completion_status text not null default 'Incomplete',
  add column if not exists review_status text not null default 'Draft',
  add column if not exists updated_by text;

alter table public.lopa_initiating_events
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists failure_mode text,
  add column if not exists equipment_system text,
  add column if not exists equipment_tag text,
  add column if not exists event_boundary text,
  add column if not exists event_trigger text,
  add column if not exists linked_consequence_id text,
  add column if not exists frequency_unit text not null default 'per year',
  add column if not exists low_estimate numeric,
  add column if not exists high_estimate numeric,
  add column if not exists confidence_level text,
  add column if not exists basis text,
  add column if not exists site_modifier numeric,
  add column if not exists site_modifier_type text,
  add column if not exists site_modifier_basis text,
  add column if not exists site_modifier_source_reference text,
  add column if not exists site_modifier_approval_status text,
  add column if not exists engineering_justification text,
  add column if not exists reviewer_required boolean not null default false,
  add column if not exists manual_entry_approval_status text,
  add column if not exists enabling_condition_status text not null default 'Not Reviewed',
  add column if not exists completion_status text not null default 'Incomplete',
  add column if not exists updated_by text;

alter table public.lopa_studies
  add column if not exists scenario_title text,
  add column if not exists scenario_description text,
  add column if not exists scenario_source text,
  add column if not exists operating_mode text,
  add column if not exists scenario_boundary text,
  add column if not exists included_equipment text,
  add column if not exists excluded_equipment text,
  add column if not exists scenario_assumptions text,
  add column if not exists scenario_exclusions text,
  add column if not exists scenario_owner_id text,
  add column if not exists scenario_review_status text not null default 'Draft',
  add column if not exists deviation text,
  add column if not exists guideword text,
  add column if not exists parameter text,
  add column if not exists cause_description text,
  add column if not exists cause_category text,
  add column if not exists cause_type text,
  add column if not exists escalation_path text,
  add column if not exists hazardous_event text,
  add column if not exists loss_event text,
  add column if not exists top_event text,
  add column if not exists safeguards_summary text,
  add column if not exists lopa_boundary_statement text,
  add column if not exists source_last_synced_at timestamptz,
  add column if not exists source_change_reason text;

create table if not exists public.lopa_impacted_receptors (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  receptor_type text not null,
  exposure_location text,
  estimated_occupancy_presence text,
  exposure_route text,
  impact_description text,
  severity text,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_risk_criteria_snapshots (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  criteria_source text not null,
  criteria_type text,
  tolerable_event_frequency numeric not null,
  frequency_unit text not null default 'per year',
  criteria_version text,
  alarp_applicable boolean not null default false,
  risk_acceptance_required boolean not null default false,
  criteria_notes text,
  approval_status text not null default 'Draft',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_scenario_notes (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  note_type text not null default 'Engineering Note',
  note_text text not null,
  linked_section text,
  status text not null default 'Open',
  created_by text,
  updated_by text,
  deleted_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_initiating_event_notes (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  note_type text not null default 'Engineering Note',
  note_text text not null,
  status text not null default 'Open',
  created_by text,
  updated_by text,
  deleted_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lopa_impacted_receptors_study_idx on public.lopa_impacted_receptors (tenant_id, lopa_study_id);
create index if not exists lopa_risk_criteria_study_idx on public.lopa_risk_criteria_snapshots (tenant_id, lopa_study_id, created_at desc);
create index if not exists lopa_scenario_notes_study_idx on public.lopa_scenario_notes (tenant_id, lopa_study_id, deleted_at);
create index if not exists lopa_ie_notes_study_idx on public.lopa_initiating_event_notes (tenant_id, lopa_study_id, deleted_at);

alter table public.lopa_impacted_receptors enable row level security;
alter table public.lopa_risk_criteria_snapshots enable row level security;
alter table public.lopa_scenario_notes enable row level security;
alter table public.lopa_initiating_event_notes enable row level security;

grant select, insert, update, delete on public.lopa_impacted_receptors to authenticated;
grant select, insert, update, delete on public.lopa_risk_criteria_snapshots to authenticated;
grant select, insert, update, delete on public.lopa_scenario_notes to authenticated;
grant select, insert, update, delete on public.lopa_initiating_event_notes to authenticated;

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.scenario.view',
    'lopa.scenario.edit',
    'lopa.scenario.sync_hazop',
    'lopa.scenario.mark_complete',
    'lopa.scenario.notes.manage',
    'lopa.consequence.view',
    'lopa.consequence.edit',
    'lopa.receptors.manage',
    'lopa.risk_criteria.select',
    'lopa.initiating_event.view',
    'lopa.initiating_event.edit',
    'lopa.initiating_event.mark_complete',
    'lopa.initiating_event.library_select',
    'lopa.site_modifier.apply',
    'lopa.conditional_modifier.select',
    'lopa.conditional_modifier.override',
    'lopa.initiating_event.notes.manage'
  ];
begin
  foreach permission_key in array permission_keys loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
      select gen_random_uuid()::text, t."id", permission_key, 'lopa', permission_key, split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)), permission_key
      from public."Tenant" t
      where not exists (select 1 from public."Permission" p where p."tenantId" = t."id" and p."key" = permission_key);
    elsif to_regclass('public.permissions') is not null then
      insert into public.permissions (id, key, module, name, description)
      values (gen_random_uuid()::text, permission_key, 'LOPA', permission_key, permission_key)
      on conflict (key) do nothing;
    end if;
  end loop;

  if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null and to_regclass('public."Permission"') is not null then
    insert into public."RolePermission" ("roleId", "permissionId")
    select r."id", p."id"
    from public."Role" r
    join public."Permission" p on p."tenantId" = r."tenantId"
    where r."key" in ('platform_admin', 'corporate_admin', 'site_admin', 'super_admin', 'hse_manager', 'process_engineer', 'operations_supervisor', 'plant_manager')
      and p."key" = any(permission_keys)
    on conflict ("roleId", "permissionId") do nothing;
  end if;
end $$;
