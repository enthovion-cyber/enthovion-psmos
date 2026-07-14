alter table public.lopa_studies
  add column if not exists risk_calculation_status text not null default 'Not Started',
  add column if not exists risk_gap_status text not null default 'Not Evaluated',
  add column if not exists sil_evaluation_required boolean not null default false,
  add column if not exists last_calculated_at timestamptz,
  add column if not exists total_pfdavg numeric,
  add column if not exists total_rrf numeric,
  add column if not exists required_rrf numeric,
  add column if not exists mitigated_event_frequency numeric,
  add column if not exists risk_gap text,
  add column if not exists sil_required boolean not null default false,
  add column if not exists target_sil text;

create table if not exists public.lopa_risk_calculations (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  calculation_number text not null,
  calculation_version integer not null default 1,
  calculation_status text not null default 'Not Started',
  result_status text not null default 'Not Calculated',
  methodology_id text,
  methodology_name text not null default 'Company Standard LOPA Frequency Method',
  methodology_version text not null default '1.0',
  ie_frequency numeric,
  ie_frequency_unit text not null default 'per year',
  combined_modifier_factor numeric,
  frequency_after_modifiers numeric,
  combined_ipl_pfdavg numeric,
  combined_ipl_rrf numeric,
  mitigated_event_frequency numeric,
  tolerable_frequency numeric,
  tolerable_frequency_unit text not null default 'per year',
  risk_gap_factor numeric,
  required_additional_rrf numeric,
  meets_risk_criteria boolean,
  additional_ipl_required boolean,
  sif_sil_evaluation_required boolean,
  low_mitigated_frequency numeric,
  high_mitigated_frequency numeric,
  confidence_level_summary text,
  input_hash text,
  snapshot_json jsonb not null default '{}'::jsonb,
  assumptions_json jsonb not null default '[]'::jsonb,
  calculation_notes text,
  locked boolean not null default false,
  locked_by text,
  locked_at timestamptz,
  superseded_by_id text,
  calculated_by text,
  calculated_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, calculation_number)
);

create table if not exists public.lopa_risk_calculation_inputs (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  risk_calculation_id text references public.lopa_risk_calculations(id) on delete cascade,
  input_type text not null,
  source_record_id text,
  source_record_type text,
  input_name text not null,
  input_value numeric,
  input_unit text,
  low_value numeric,
  high_value numeric,
  included boolean not null default true,
  exclusion_reason text,
  source_reference text,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_risk_calculation_versions (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  risk_calculation_id text not null references public.lopa_risk_calculations(id) on delete cascade,
  version_number integer not null,
  status text not null,
  input_hash text,
  snapshot_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  calculated_by text,
  calculated_at timestamptz,
  locked boolean not null default false,
  locked_by text,
  locked_at timestamptz,
  superseded_by_id text,
  notes text,
  created_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, version_number)
);

create table if not exists public.lopa_risk_calculation_assumptions (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  risk_calculation_id text references public.lopa_risk_calculations(id) on delete set null,
  assumption_type text not null default 'General',
  assumption_title text not null,
  description text,
  source_reference text,
  related_input_type text,
  related_input_id text,
  impact text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_risk_calculation_gaps (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  risk_calculation_id text references public.lopa_risk_calculations(id) on delete set null,
  gap_type text not null,
  gap_title text not null,
  gap_description text,
  severity text not null default 'Medium',
  closure_blocker boolean not null default true,
  action_id text,
  status text not null default 'Open',
  created_by text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lopa_risk_calculations_study_idx on public.lopa_risk_calculations (tenant_id, lopa_study_id, calculation_status, locked);
create index if not exists lopa_risk_calculation_inputs_calc_idx on public.lopa_risk_calculation_inputs (tenant_id, lopa_study_id, risk_calculation_id, input_type);
create index if not exists lopa_risk_calculation_versions_study_idx on public.lopa_risk_calculation_versions (tenant_id, lopa_study_id, version_number);
create index if not exists lopa_risk_calculation_gaps_study_idx on public.lopa_risk_calculation_gaps (tenant_id, lopa_study_id, status, closure_blocker);

alter table public.lopa_risk_calculations enable row level security;
alter table public.lopa_risk_calculation_inputs enable row level security;
alter table public.lopa_risk_calculation_versions enable row level security;
alter table public.lopa_risk_calculation_assumptions enable row level security;
alter table public.lopa_risk_calculation_gaps enable row level security;

grant select, insert, update, delete on public.lopa_risk_calculations to authenticated;
grant select, insert, update, delete on public.lopa_risk_calculation_inputs to authenticated;
grant select, insert, update, delete on public.lopa_risk_calculation_versions to authenticated;
grant select, insert, update, delete on public.lopa_risk_calculation_assumptions to authenticated;
grant select, insert, update, delete on public.lopa_risk_calculation_gaps to authenticated;

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.risk_calculation.view',
    'lopa.risk_calculation.calculate',
    'lopa.risk_calculation.recalculate',
    'lopa.risk_calculation.lock',
    'lopa.risk_calculation.unlock',
    'lopa.risk_calculation.assumptions.manage',
    'lopa.risk_calculation.gaps.manage',
    'lopa.risk_calculation.export',
    'lopa.risk_calculation.versions.view',
    'lopa.risk_calculation.override'
  ];
begin
  foreach permission_key in array permission_keys loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, t."id", permission_key, 'lopa', permission_key
      from public."Tenant" t
      where not exists (select 1 from public."Permission" p where p."tenantId" = t."id" and p."key" = permission_key);
    elsif to_regclass('public.permissions') is not null then
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'permissions' and column_name = 'module') then
        insert into public.permissions (id, key, module, name, description)
        values (gen_random_uuid()::text, permission_key, 'LOPA', permission_key, permission_key)
        on conflict (key) do nothing;
      else
        insert into public.permissions (id, key, name, description)
        values (gen_random_uuid()::text, permission_key, permission_key, permission_key)
        on conflict (key) do nothing;
      end if;
    end if;
  end loop;

  if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null and to_regclass('public."Permission"') is not null then
    insert into public."RolePermission" ("roleId", "permissionId")
    select r."id", p."id"
    from public."Role" r
    join public."Permission" p on p."tenantId" = r."tenantId"
    where p."key" = any(permission_keys)
      and lower(r."name") in ('super admin', 'company admin', 'site admin', 'hse manager', 'process safety lead', 'process safety engineer', 'plant manager')
      and not exists (
        select 1
        from public."RolePermission" rp
        where rp."roleId" = r."id"
          and rp."permissionId" = p."id"
      );
  end if;
end $$;
