create table if not exists public.lopa_initiating_event_library (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  parent_id text,
  event_code text not null,
  event_name text not null,
  description text,
  event_category text not null,
  failure_mode text,
  equipment_type text,
  subtype text,
  service_application text,
  base_frequency numeric not null check (base_frequency > 0),
  frequency_unit text not null,
  low_frequency numeric,
  high_frequency numeric,
  confidence_level text,
  source_type text not null,
  source_reference text not null,
  standard_reference text,
  applicability_notes text,
  exclusion_notes text,
  scope text not null default 'Corporate',
  site_modifier_allowed boolean not null default false,
  default_site_modifier numeric not null default 1,
  engineering_justification_required boolean not null default false,
  engineering_justification text,
  approval_status text not null default 'Draft',
  revision integer not null default 1,
  revision_notes text,
  active boolean not null default true,
  reviewed_by text,
  reviewed_at timestamptz,
  review_comment text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lopa_ie_range_check check (
    (low_frequency is null or low_frequency <= base_frequency)
    and (high_frequency is null or high_frequency >= base_frequency)
    and (low_frequency is null or high_frequency is null or low_frequency <= high_frequency)
  )
);

create table if not exists public.lopa_conditional_modifier_library (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  parent_id text,
  modifier_code text not null,
  modifier_name text not null,
  description text,
  modifier_type text not null,
  application_context text,
  default_value numeric not null check (default_value >= 0 and default_value <= 1),
  low_value numeric,
  high_value numeric,
  unit text not null default 'probability',
  confidence_level text,
  source_type text not null,
  source_reference text not null,
  standard_reference text,
  applicability_notes text,
  exclusion_notes text,
  scope text not null default 'Corporate',
  override_allowed boolean not null default false,
  engineering_justification_required boolean not null default false,
  engineering_justification text,
  approval_status text not null default 'Draft',
  revision integer not null default 1,
  revision_notes text,
  active boolean not null default true,
  reviewed_by text,
  reviewed_at timestamptz,
  review_comment text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lopa_cm_range_check check (
    (low_value is null or low_value <= default_value)
    and (high_value is null or high_value >= default_value)
    and (low_value is null or high_value is null or low_value <= high_value)
  )
);

create table if not exists public.lopa_study_initiating_event_snapshots (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  library_event_id text references public.lopa_initiating_event_library(id) on delete set null,
  library_revision integer,
  event_code text not null,
  event_name text not null,
  event_category text,
  failure_mode text,
  selected_frequency numeric not null,
  frequency_unit text not null,
  base_frequency numeric,
  low_frequency numeric,
  high_frequency numeric,
  site_modifier numeric,
  source_type text,
  source_reference text,
  standard_reference text,
  confidence_level text,
  engineering_justification text,
  source_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  selected_by text,
  selected_at timestamptz not null default now()
);

create table if not exists public.lopa_study_conditional_modifier_snapshots (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  library_modifier_id text references public.lopa_conditional_modifier_library(id) on delete set null,
  library_revision integer,
  modifier_code text not null,
  modifier_name text not null,
  modifier_type text,
  selected_value numeric not null,
  default_value numeric,
  low_value numeric,
  high_value numeric,
  unit text,
  source_type text,
  source_reference text,
  standard_reference text,
  confidence_level text,
  engineering_justification text,
  source_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'Active',
  notes text,
  selected_by text,
  selected_at timestamptz not null default now()
);

create unique index if not exists lopa_ie_library_code_revision_idx on public.lopa_initiating_event_library (tenant_id, event_code, revision);
create index if not exists lopa_ie_library_scope_idx on public.lopa_initiating_event_library (tenant_id, site_id, approval_status, active);
create unique index if not exists lopa_cm_library_code_revision_idx on public.lopa_conditional_modifier_library (tenant_id, modifier_code, revision);
create index if not exists lopa_cm_library_scope_idx on public.lopa_conditional_modifier_library (tenant_id, site_id, approval_status, active);
create index if not exists lopa_study_ie_snapshot_idx on public.lopa_study_initiating_event_snapshots (tenant_id, lopa_study_id, selected_at desc);
create index if not exists lopa_study_cm_snapshot_idx on public.lopa_study_conditional_modifier_snapshots (tenant_id, lopa_study_id, status, selected_at desc);

alter table public.lopa_initiating_event_library enable row level security;
alter table public.lopa_conditional_modifier_library enable row level security;
alter table public.lopa_study_initiating_event_snapshots enable row level security;
alter table public.lopa_study_conditional_modifier_snapshots enable row level security;

grant select, insert, update, delete on public.lopa_initiating_event_library to authenticated;
grant select, insert, update, delete on public.lopa_conditional_modifier_library to authenticated;
grant select, insert, update, delete on public.lopa_study_initiating_event_snapshots to authenticated;
grant select, insert, update, delete on public.lopa_study_conditional_modifier_snapshots to authenticated;

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.library.view',
    'lopa.library.create',
    'lopa.library.edit',
    'lopa.library.submit_review',
    'lopa.library.approve',
    'lopa.library.reject',
    'lopa.library.archive',
    'lopa.library.revision.create',
    'lopa.initiating_event_library.view',
    'lopa.initiating_event_library.use',
    'lopa.conditional_modifier_library.view',
    'lopa.conditional_modifier_library.use',
    'lopa.manual_frequency_entry',
    'lopa.manual_modifier_entry',
    'lopa.override_library_value'
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
