insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values ('perm_ptw_sign', 'tenant_alkylation', 'ptw.sign', 'ptw', 'Sign PTW')
on conflict (id) do update set key = excluded.key, label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r.key in ('platform_admin', 'corporate_admin', 'site_admin', 'hse_manager', 'plant_manager', 'permit_issuer', 'operations_supervisor')
  and p.id = 'perm_ptw_sign'
on conflict do nothing;
