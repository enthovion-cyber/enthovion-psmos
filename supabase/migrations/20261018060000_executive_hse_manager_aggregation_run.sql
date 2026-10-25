-- HSE Managers own the PSM health foundation and may initiate an audited,
-- source-backed Executive KPI aggregation. They receive no configuration,
-- archival, or alert-resolution permissions from this grant.
insert into public."RolePermission" ("roleId", "permissionId")
select role_row."id", permission_row."id"
from public."Role" role_row
join public."Permission" permission_row
  on permission_row."tenantId" = role_row."tenantId"
where lower(replace(coalesce(role_row."key", ''), '_', ' ')) = 'hse manager'
  and permission_row."key" = 'executive.aggregation.run'
  and not exists (
    select 1
    from public."RolePermission" existing
    where existing."roleId" = role_row."id"
      and existing."permissionId" = permission_row."id"
  );
