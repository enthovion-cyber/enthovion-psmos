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
  grant_keys text[] := array[
    'psi.view',
    'psi.dashboard.view',
    'psi.unit.view',
    'psi.completeness.view',
    'psi.completeness.dashboard.view',
    'psi.completeness.matrix.view',
    'psi.completeness.gap.view',
    'psi.completeness.requirement.view',
    'psi.completeness.waiver.view',
    'psi.completeness.settings.view',
    'psi.integration.view',
    'psi.integration.dashboard.view',
    'psi.review.view',
    'psi.review.dashboard.view',
    'psi.review.inbox.view',
    'psi.review.snapshot.view',
    'psi.review.history.view',
    'psi.review.rule.view',
    'psi.review.settings.view'
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
    and permission_row."key" = any(grant_keys)
    and not exists (
      select 1
      from public."RolePermission" existing
      where existing."roleId" = role_row."id"
        and existing."permissionId" = permission_row."id"
    );

  insert into public."RolePermission" ("roleId", "permissionId")
  select distinct existing_role_permission."roleId", dashboard_permission."id"
  from public."RolePermission" existing_role_permission
  join public."Permission" existing_permission on existing_permission."id" = existing_role_permission."permissionId"
  join public."Permission" dashboard_permission
    on dashboard_permission."tenantId" = existing_permission."tenantId"
   and dashboard_permission."key" in ('psi.view', 'psi.dashboard.view')
  where existing_permission."key" like 'psi.%'
    and not exists (
      select 1
      from public."RolePermission" already_granted
      where already_granted."roleId" = existing_role_permission."roleId"
        and already_granted."permissionId" = dashboard_permission."id"
    );
end $$;
