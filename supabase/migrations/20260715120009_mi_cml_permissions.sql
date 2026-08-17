-- Mechanical Integrity Phase 3 - technical data/CML permissions.

do $$
declare
  permission_row record;
  tenant_row record;
  role_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_row in
      select * from (values
        ('mechanical_integrity.technical_data.revision.view', 'View MI technical data revisions'),
        ('mechanical_integrity.cml.view', 'View MI CML/TML registry'),
        ('mechanical_integrity.cml.create', 'Create MI CML/TML records'),
        ('mechanical_integrity.cml.edit', 'Edit MI CML/TML records'),
        ('mechanical_integrity.cml.archive', 'Archive MI CML/TML records'),
        ('mechanical_integrity.cml.import', 'Import MI CML/TML records'),
        ('mechanical_integrity.cml.export', 'Export MI CML/TML records'),
        ('mechanical_integrity.cml_reading.view', 'View MI CML/TML readings'),
        ('mechanical_integrity.cml_reading.create', 'Create MI CML/TML readings'),
        ('mechanical_integrity.cml_reading.edit', 'Edit MI CML/TML readings'),
        ('mechanical_integrity.cml_reading.review', 'Review MI CML/TML readings'),
        ('mechanical_integrity.cml_reading.approve', 'Approve MI CML/TML readings'),
        ('mechanical_integrity.cml_reading.import', 'Import MI CML/TML readings'),
        ('mechanical_integrity.cml_calculation.view', 'View MI CML/TML calculations'),
        ('mechanical_integrity.cml_calculation.recalculate', 'Recalculate MI CML/TML calculations'),
        ('mechanical_integrity.cml_calculation.override', 'Override MI CML/TML calculations'),
        ('mechanical_integrity.cml_alert.view', 'View MI CML/TML alerts'),
        ('mechanical_integrity.cml_alert.acknowledge', 'Acknowledge MI CML/TML alerts'),
        ('mechanical_integrity.cml_alert.resolve', 'Resolve MI CML/TML alerts')
      ) as p(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_row.permission_key, 'mechanical_integrity', permission_row.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_row.permission_key
      );
    end loop;

    for role_row in
      select id from public."Role"
      where "tenantId" = tenant_row.id
        and lower(name) in ('super admin', 'admin', 'administrator', 'site admin', 'maintenance manager', 'mechanical integrity manager')
    loop
      insert into public."RolePermission" ("roleId", "permissionId")
      select role_row.id, permission.id
      from public."Permission" permission
      where permission."tenantId" = tenant_row.id
        and permission."moduleKey" = 'mechanical_integrity'
        and not exists (
          select 1 from public."RolePermission" rp
          where rp."roleId" = role_row.id and rp."permissionId" = permission.id
        );
    end loop;
  end loop;
end $$;
