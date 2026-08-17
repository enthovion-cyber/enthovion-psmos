do $$
declare
  tenant_record record;
  permission_record record;
begin
  for tenant_record in select id from public."Tenant" loop
    for permission_record in
      select * from (values
        ('mechanical_integrity.relief_device.view', 'View relief devices'),
        ('mechanical_integrity.relief_device.create', 'Create relief devices'),
        ('mechanical_integrity.relief_device.edit', 'Edit relief devices'),
        ('mechanical_integrity.relief_device.archive', 'Archive relief devices'),
        ('mechanical_integrity.relief_device.import', 'Import relief devices'),
        ('mechanical_integrity.relief_device.export', 'Export relief devices'),
        ('mechanical_integrity.relief_device_technical.view', 'View relief technical data'),
        ('mechanical_integrity.relief_device_technical.edit', 'Edit relief technical data'),
        ('mechanical_integrity.relief_basis.view', 'View relief basis'),
        ('mechanical_integrity.relief_basis.edit', 'Edit relief basis'),
        ('mechanical_integrity.relief_protection.view', 'View protected equipment links'),
        ('mechanical_integrity.relief_protection.manage', 'Manage protected equipment links'),
        ('mechanical_integrity.relief_test.view', 'View relief device tests'),
        ('mechanical_integrity.relief_test.create', 'Create relief device tests'),
        ('mechanical_integrity.relief_test.edit', 'Edit relief device tests'),
        ('mechanical_integrity.relief_test.submit', 'Submit relief device tests'),
        ('mechanical_integrity.relief_test.review', 'Review relief device tests'),
        ('mechanical_integrity.relief_test.approve', 'Approve relief device tests'),
        ('mechanical_integrity.relief_test.reject', 'Reject relief device tests'),
        ('mechanical_integrity.relief_test.export', 'Export relief device tests'),
        ('mechanical_integrity.relief_certificate.view', 'View relief certificates'),
        ('mechanical_integrity.relief_certificate.manage', 'Manage relief certificates'),
        ('mechanical_integrity.relief_scheduler.view', 'View relief scheduler'),
        ('mechanical_integrity.relief_scheduler.run', 'Run relief scheduler'),
        ('mechanical_integrity.relief_scheduler.override', 'Override relief scheduler')
      ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_record.permission_key, 'MECHANICAL_INTEGRITY', permission_record.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_record.permission_key
      );
    end loop;
  end loop;
end $$;
