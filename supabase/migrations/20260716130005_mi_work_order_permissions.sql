do $$
declare
  tenant_record record;
  permission_record record;
begin
  for tenant_record in select "id" from public."Tenant"
  loop
    for permission_record in
      select * from (values
        ('mechanical_integrity.work_order.view', 'View MI work orders'),
        ('mechanical_integrity.work_order.create', 'Create MI work order'),
        ('mechanical_integrity.work_order.edit', 'Edit MI work order'),
        ('mechanical_integrity.work_order.submit', 'Submit MI work order'),
        ('mechanical_integrity.work_order.approve', 'Approve MI work order'),
        ('mechanical_integrity.work_order.reject', 'Reject MI work order'),
        ('mechanical_integrity.work_order.plan', 'Plan MI work order'),
        ('mechanical_integrity.work_order.assign', 'Assign MI work order'),
        ('mechanical_integrity.work_order.start', 'Start MI work order'),
        ('mechanical_integrity.work_order.complete', 'Complete MI work order'),
        ('mechanical_integrity.work_order.verify', 'Verify MI work order'),
        ('mechanical_integrity.work_order.close', 'Close MI work order'),
        ('mechanical_integrity.work_order.cancel', 'Cancel MI work order'),
        ('mechanical_integrity.work_order.import', 'Import MI work orders'),
        ('mechanical_integrity.work_order.export', 'Export MI work orders'),
        ('mechanical_integrity.action.view', 'View MI actions'),
        ('mechanical_integrity.action.create', 'Create MI action'),
        ('mechanical_integrity.action.edit', 'Edit MI action'),
        ('mechanical_integrity.action.assign', 'Assign MI action'),
        ('mechanical_integrity.action.complete', 'Complete MI action'),
        ('mechanical_integrity.action.verify', 'Verify MI action'),
        ('mechanical_integrity.action.close', 'Close MI action')
      ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record."id", permission_record.permission_key, 'MECHANICAL_INTEGRITY', permission_record.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record."id" and "key" = permission_record.permission_key
      );
    end loop;
  end loop;
end $$;
