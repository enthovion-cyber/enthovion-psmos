-- Mechanical Integrity Phase 4 - inspection plan and scheduler permissions.

do $$
declare
  permission_row record;
  tenant_row record;
  role_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_row in
      select * from (values
        ('mechanical_integrity.inspection_plan.view', 'View MI inspection plans'),
        ('mechanical_integrity.inspection_plan.create', 'Create MI inspection plans'),
        ('mechanical_integrity.inspection_plan.edit', 'Edit MI inspection plans'),
        ('mechanical_integrity.inspection_plan.archive', 'Archive MI inspection plans'),
        ('mechanical_integrity.inspection_plan.submit', 'Submit MI inspection plans'),
        ('mechanical_integrity.inspection_plan.approve', 'Approve MI inspection plans'),
        ('mechanical_integrity.inspection_plan.reject', 'Reject MI inspection plans'),
        ('mechanical_integrity.inspection_plan.revision.create', 'Create MI inspection plan revisions'),
        ('mechanical_integrity.inspection_plan.import', 'Import MI inspection plans'),
        ('mechanical_integrity.inspection_plan.export', 'Export MI inspection plans'),
        ('mechanical_integrity.inspection_scheduler.view', 'View MI inspection scheduler'),
        ('mechanical_integrity.inspection_scheduler.run', 'Run MI inspection scheduler'),
        ('mechanical_integrity.inspection_scheduler.rule.view', 'View MI inspection scheduler rules'),
        ('mechanical_integrity.inspection_scheduler.rule.manage', 'Manage MI inspection scheduler rules'),
        ('mechanical_integrity.inspection_scheduler.override', 'Override MI inspection schedules'),
        ('mechanical_integrity.inspection_occurrence.view', 'View MI inspection occurrences'),
        ('mechanical_integrity.inspection_occurrence.assign', 'Assign MI inspection occurrences'),
        ('mechanical_integrity.inspection_occurrence.cancel', 'Cancel MI inspection occurrences'),
        ('mechanical_integrity.inspection_occurrence.export', 'Export MI inspection occurrences'),
        ('mechanical_integrity.inspection_checklist.view', 'View MI inspection checklist'),
        ('mechanical_integrity.inspection_checklist.manage', 'Manage MI inspection checklist'),
        ('mechanical_integrity.inspection_criteria.view', 'View MI inspection criteria'),
        ('mechanical_integrity.inspection_criteria.manage', 'Manage MI inspection criteria')
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
