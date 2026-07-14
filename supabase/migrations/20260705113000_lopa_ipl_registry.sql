create table if not exists public.lopa_ipl_registry (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  parent_id text,
  registry_number text not null,
  ipl_name text not null,
  ipl_type text not null,
  description text,
  service_application text,
  equipment_type text,
  process_service text,
  protected_equipment text,
  safe_state text,
  demand_source text,
  risk_reduction_claim text,
  pfdavg numeric,
  rrf numeric,
  pfd_basis text,
  rrf_basis text,
  source_type text,
  source_reference text,
  standard_reference text,
  proof_test_interval text,
  proof_test_basis text,
  inspection_requirement text,
  maintenance_requirement text,
  owner_id text,
  approval_status text not null default 'Draft',
  revision integer not null default 1,
  revision_notes text,
  active boolean not null default true,
  archived_at timestamptz,
  archived_by text,
  restored_at timestamptz,
  restored_by text,
  reviewed_by text,
  reviewed_at timestamptz,
  review_comment text,
  review_due_date date,
  proof_test_due_date date,
  validation_status text not null default 'Not Started',
  criteria_template jsonb not null default '{}'::jsonb,
  type_details jsonb not null default '{}'::jsonb,
  required_documents jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  usage_count integer not null default 0,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, registry_number, revision)
);

create table if not exists public.lopa_ipl_registry_validation_items (
  id text primary key,
  tenant_id text not null,
  registry_id text not null references public.lopa_ipl_registry(id) on delete cascade,
  criteria_key text not null,
  criteria_label text not null,
  mandatory boolean not null default true,
  status text not null default 'Not Reviewed',
  evidence_required boolean not null default false,
  evidence_status text not null default 'Not Provided',
  notes text,
  sort_order integer not null default 0,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, registry_id, criteria_key)
);

create table if not exists public.lopa_ipl_registry_equipment_links (
  id text primary key,
  tenant_id text not null,
  registry_id text not null references public.lopa_ipl_registry(id) on delete cascade,
  equipment_id text,
  equipment_tag text,
  equipment_name text,
  equipment_type text,
  link_type text not null default 'Protected Equipment',
  status text,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_ipl_registry_document_links (
  id text primary key,
  tenant_id text not null,
  registry_id text not null references public.lopa_ipl_registry(id) on delete cascade,
  document_id text,
  document_number text,
  document_title text,
  document_type text,
  revision text,
  status text,
  effective_date date,
  link_type text not null default 'Basis Document',
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_ipl_registry_history (
  id text primary key,
  tenant_id text not null,
  registry_id text not null references public.lopa_ipl_registry(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  actor_id text,
  severity text not null default 'Info',
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_study_ipl_registry_snapshots (
  id text primary key,
  tenant_id text not null,
  lopa_study_id text,
  registry_id text not null references public.lopa_ipl_registry(id),
  registry_revision integer not null,
  snapshot_payload jsonb not null,
  selected_by text,
  selected_at timestamptz not null default now()
);

create index if not exists lopa_ipl_registry_tenant_status_idx on public.lopa_ipl_registry (tenant_id, approval_status, active, updated_at desc);
create index if not exists lopa_ipl_registry_site_type_idx on public.lopa_ipl_registry (tenant_id, site_id, ipl_type);
create index if not exists lopa_ipl_registry_validation_idx on public.lopa_ipl_registry_validation_items (tenant_id, registry_id, mandatory, status);
create index if not exists lopa_ipl_registry_equipment_idx on public.lopa_ipl_registry_equipment_links (tenant_id, registry_id, equipment_id);
create index if not exists lopa_ipl_registry_document_idx on public.lopa_ipl_registry_document_links (tenant_id, registry_id, document_id);
create index if not exists lopa_ipl_registry_history_idx on public.lopa_ipl_registry_history (tenant_id, registry_id, created_at desc);

alter table public.lopa_ipl_registry enable row level security;
alter table public.lopa_ipl_registry_validation_items enable row level security;
alter table public.lopa_ipl_registry_equipment_links enable row level security;
alter table public.lopa_ipl_registry_document_links enable row level security;
alter table public.lopa_ipl_registry_history enable row level security;
alter table public.lopa_study_ipl_registry_snapshots enable row level security;

grant select, insert, update, delete on public.lopa_ipl_registry to authenticated;
grant select, insert, update, delete on public.lopa_ipl_registry_validation_items to authenticated;
grant select, insert, update, delete on public.lopa_ipl_registry_equipment_links to authenticated;
grant select, insert, update, delete on public.lopa_ipl_registry_document_links to authenticated;
grant select, insert, update, delete on public.lopa_ipl_registry_history to authenticated;
grant select, insert, update, delete on public.lopa_study_ipl_registry_snapshots to authenticated;

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.ipl_registry.view',
    'lopa.ipl_registry.create',
    'lopa.ipl_registry.edit',
    'lopa.ipl_registry.delete',
    'lopa.ipl_registry.submit_review',
    'lopa.ipl_registry.approve',
    'lopa.ipl_registry.reject',
    'lopa.ipl_registry.archive',
    'lopa.ipl_registry.restore',
    'lopa.ipl_registry.revision.create',
    'lopa.ipl_registry.import',
    'lopa.ipl_registry.export',
    'lopa.ipl_registry.links.manage',
    'lopa.ipl_registry.validation.manage',
    'lopa.ipl_registry.history.view',
    'lopa.ipl_registry.use_in_study'
  ];
begin
  foreach permission_key in array permission_keys loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
      select gen_random_uuid()::text, t."id", permission_key, 'lopa', permission_key,
        split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)), permission_key
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
