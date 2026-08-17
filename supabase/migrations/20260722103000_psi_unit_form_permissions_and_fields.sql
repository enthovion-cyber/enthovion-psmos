do $$
declare
  permission_rows text[][] := array[
    array['psi.unit.view', 'View PSI units'],
    array['psi.unit.create', 'Create PSI units'],
    array['psi.unit.edit', 'Edit PSI units'],
    array['psi.unit.archive', 'Archive PSI units'],
    array['psi.unit.link_equipment', 'Link equipment to PSI units'],
    array['psi.unit.unlink_equipment', 'Unlink equipment from PSI units'],
    array['psi.unit.assign_owner', 'Assign PSI unit owners'],
    array['psi.unit.assign_reviewer', 'Assign PSI unit reviewers'],
    array['equipment.view', 'View equipment'],
    array['users.view', 'View users']
  ];
  permission_row text[];
begin
  foreach permission_row slice 1 in array permission_rows loop
    insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
    select gen_random_uuid()::text, tenant_row."id", permission_row[1], 'PSI', permission_row[2]
    from public."Tenant" tenant_row
    where not exists (
      select 1
      from public."Permission" existing
      where existing."tenantId" = tenant_row."id"
        and existing."key" = permission_row[1]
    );
  end loop;
end $$;

alter table public.psi_units
  add column if not exists document_controller_id text,
  add column if not exists mechanical_mi_contact_id text,
  add column if not exists electrical_instrument_contact_id text,
  add column if not exists relief_specialist_id text,
  add column if not exists process_service text,
  add column if not exists process_block text,
  add column if not exists critical_unit boolean not null default false,
  add column if not exists source_of_truth_status text,
  add column if not exists validation_status text,
  add column if not exists validation_notes text;

alter table public.psi_unit_equipment_links
  add column if not exists primary_equipment boolean not null default false,
  add column if not exists relationship_note text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists removed_by text,
  add column if not exists removed_at timestamptz,
  add column if not exists remove_reason text;

create index if not exists psi_units_company_site_idx on public.psi_units (company_id, site_id);
create index if not exists psi_units_department_idx on public.psi_units (company_id, department_id);
create index if not exists psi_units_area_idx on public.psi_units (company_id, area_id);
create index if not exists psi_units_owner_idx on public.psi_units (company_id, psi_owner_id);
create index if not exists psi_unit_equipment_links_unit_idx on public.psi_unit_equipment_links (company_id, unit_id);
create index if not exists psi_unit_equipment_links_equipment_idx on public.psi_unit_equipment_links (company_id, equipment_id);

alter table public.psi_units enable row level security;
alter table public.psi_unit_equipment_links enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_units' and policyname = 'psi_units_service_role_all') then
    create policy "psi_units_service_role_all" on public.psi_units for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_unit_equipment_links' and policyname = 'psi_unit_equipment_links_service_role_all') then
    create policy "psi_unit_equipment_links_service_role_all" on public.psi_unit_equipment_links for all to service_role using (true) with check (true);
  end if;
end $$;

do $$
declare
  admin_role_names text[] := array[
    'super admin',
    'company admin',
    'site admin',
    'administrator',
    'admin',
    'hse manager',
    'process safety lead',
    'process safety engineer',
    'plant manager'
  ];
  admin_grant_keys text[] := array[
    'psi.view',
    'psi.dashboard.view',
    'psi.unit.view',
    'psi.unit.create',
    'psi.unit.edit',
    'psi.unit.archive',
    'psi.unit.link_equipment',
    'psi.unit.unlink_equipment',
    'psi.unit.assign_owner',
    'psi.unit.assign_reviewer',
    'equipment.view',
    'users.view'
  ];
begin
  insert into public."RolePermission" ("roleId", "permissionId")
  select role_row."id", permission_row."id"
  from public."Role" role_row
  join public."Permission" permission_row on permission_row."tenantId" = role_row."tenantId"
  where (
      lower(coalesce(role_row."name", '')) = any(admin_role_names)
      or lower(replace(coalesce(role_row."key", ''), '_', ' ')) = any(admin_role_names)
    )
    and permission_row."key" = any(admin_grant_keys)
    and not exists (
      select 1
      from public."RolePermission" existing
      where existing."roleId" = role_row."id"
        and existing."permissionId" = permission_row."id"
    );

  insert into public."RolePermission" ("roleId", "permissionId")
  select distinct existing_role_permission."roleId", unit_view_permission."id"
  from public."RolePermission" existing_role_permission
  join public."Permission" existing_permission on existing_permission."id" = existing_role_permission."permissionId"
  join public."Permission" unit_view_permission
    on unit_view_permission."tenantId" = existing_permission."tenantId"
   and unit_view_permission."key" = 'psi.unit.view'
  where existing_permission."key" in ('psi.view', 'psi.dashboard.view')
    and not exists (
      select 1
      from public."RolePermission" already_granted
      where already_granted."roleId" = existing_role_permission."roleId"
        and already_granted."permissionId" = unit_view_permission."id"
    );

  insert into public."RolePermission" ("roleId", "permissionId")
  select distinct existing_role_permission."roleId", write_permission."id"
  from public."RolePermission" existing_role_permission
  join public."Permission" existing_permission on existing_permission."id" = existing_role_permission."permissionId"
  join public."Permission" write_permission
    on write_permission."tenantId" = existing_permission."tenantId"
   and write_permission."key" in (
     'psi.unit.view',
     'psi.unit.create',
     'psi.unit.edit',
     'psi.unit.archive',
     'psi.unit.link_equipment',
     'psi.unit.unlink_equipment',
     'psi.unit.assign_owner',
     'psi.unit.assign_reviewer',
     'equipment.view',
     'users.view'
   )
  where existing_permission."key" in ('psi:manage', 'psi.unit.edit', 'psi.unit.create')
    and not exists (
      select 1
      from public."RolePermission" already_granted
      where already_granted."roleId" = existing_role_permission."roleId"
        and already_granted."permissionId" = write_permission."id"
    );
end $$;
