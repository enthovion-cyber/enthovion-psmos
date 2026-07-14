create table if not exists public.lopa_studies (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  unit_id text,
  area_id text,
  lopa_number text not null,
  title text not null,
  description text,
  study_type text not null default 'New LOPA',
  source text not null default 'Manual',
  source_module text,
  source_record_id text,
  source_hazop_study_id text,
  source_hazop_scenario_id text,
  source_snapshot_id text,
  equipment_tag text,
  equipment_id text,
  owner_id text,
  facilitator_id text,
  priority text not null default 'Medium',
  status text not null default 'Draft',
  consequence_severity text,
  initiating_event_frequency numeric,
  ipl_count integer not null default 0,
  credited_ipl_count integer not null default 0,
  calculation_status text not null default 'Not Started',
  mitigated_event_frequency numeric,
  tolerable_frequency numeric,
  risk_gap text,
  sil_required boolean not null default false,
  target_sil text,
  sil_gap_status text not null default 'Not Evaluated',
  ipl_validation_status text not null default 'Not Started',
  open_actions_count integer not null default 0,
  due_date date,
  revalidation_due_date date,
  confidentiality_level text not null default 'Internal',
  tags jsonb not null default '[]'::jsonb,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_number)
);

create table if not exists public.lopa_source_snapshots (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text references public.lopa_studies(id) on delete cascade,
  source_module text not null,
  source_record_id text not null,
  source_payload jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_consequences (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  description text not null,
  category text,
  severity text,
  impacted_receptor text,
  tolerable_event_frequency numeric,
  risk_criteria_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_initiating_events (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  description text not null,
  event_category text,
  frequency_method text,
  library_event text,
  frequency_per_year numeric,
  frequency_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_imported_safeguards (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  source_safeguard_id text,
  safeguard_name text not null,
  safeguard_type text,
  description text,
  proposed_lopa_use text not null default 'Safeguard Only',
  credited_as_ipl boolean not null default false,
  validation_status text not null default 'Not Started',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_team_members (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  user_id text,
  display_name text,
  email text,
  role text not null,
  discipline text,
  required boolean not null default false,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_history_events (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text references public.lopa_studies(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  actor_id text,
  severity text not null default 'Info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lopa_studies_tenant_site_status_idx on public.lopa_studies (tenant_id, site_id, status);
create index if not exists lopa_studies_source_hazop_scenario_idx on public.lopa_studies (tenant_id, source_hazop_scenario_id);
create index if not exists lopa_studies_due_idx on public.lopa_studies (tenant_id, due_date, revalidation_due_date);
create index if not exists lopa_source_snapshots_study_idx on public.lopa_source_snapshots (tenant_id, lopa_study_id);
create index if not exists lopa_consequences_study_idx on public.lopa_consequences (tenant_id, lopa_study_id);
create index if not exists lopa_initiating_events_study_idx on public.lopa_initiating_events (tenant_id, lopa_study_id);
create index if not exists lopa_imported_safeguards_study_idx on public.lopa_imported_safeguards (tenant_id, lopa_study_id);
create index if not exists lopa_team_members_study_idx on public.lopa_team_members (tenant_id, lopa_study_id);
create index if not exists lopa_history_events_study_idx on public.lopa_history_events (tenant_id, lopa_study_id, created_at desc);

alter table public.lopa_studies enable row level security;
alter table public.lopa_source_snapshots enable row level security;
alter table public.lopa_consequences enable row level security;
alter table public.lopa_initiating_events enable row level security;
alter table public.lopa_imported_safeguards enable row level security;
alter table public.lopa_team_members enable row level security;
alter table public.lopa_history_events enable row level security;

grant select, insert, update, delete on public.lopa_studies to authenticated;
grant select, insert, update, delete on public.lopa_source_snapshots to authenticated;
grant select, insert, update, delete on public.lopa_consequences to authenticated;
grant select, insert, update, delete on public.lopa_initiating_events to authenticated;
grant select, insert, update, delete on public.lopa_imported_safeguards to authenticated;
grant select, insert, update, delete on public.lopa_team_members to authenticated;
grant select, insert on public.lopa_history_events to authenticated;

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.dashboard.view',
    'lopa.view',
    'lopa.create',
    'lopa.create_from_hazop',
    'lopa.edit',
    'lopa.cancel',
    'lopa.reopen',
    'lopa.export',
    'lopa.hazop_scenarios.view',
    'lopa.source_snapshot.view'
  ];
begin
  foreach permission_key in array permission_keys loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
      select gen_random_uuid()::text, t."id", permission_key, 'lopa', permission_key, split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)), permission_key
      from public."Tenant" t
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = t."id" and p."key" = permission_key
      );
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
