do $$
declare
  tenant_row record;
  permission_record record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_record in
      select * from (values
        ('mechanical_integrity.deficiency.view', 'View MI deficiencies'),
        ('mechanical_integrity.deficiency.create', 'Create MI deficiency'),
        ('mechanical_integrity.deficiency.edit', 'Edit MI deficiency'),
        ('mechanical_integrity.deficiency.submit', 'Submit MI deficiency'),
        ('mechanical_integrity.deficiency.review', 'Review MI deficiency'),
        ('mechanical_integrity.deficiency.approve', 'Approve MI deficiency'),
        ('mechanical_integrity.deficiency.reject', 'Reject MI deficiency'),
        ('mechanical_integrity.deficiency.verify', 'Verify MI deficiency'),
        ('mechanical_integrity.deficiency.close', 'Close MI deficiency'),
        ('mechanical_integrity.deficiency.cancel', 'Cancel MI deficiency'),
        ('mechanical_integrity.deficiency.import', 'Import MI deficiencies'),
        ('mechanical_integrity.deficiency.export', 'Export MI deficiencies'),
        ('mechanical_integrity.deviation.view', 'View MI deviations'),
        ('mechanical_integrity.deviation.create', 'Create MI deviation'),
        ('mechanical_integrity.deviation.edit', 'Edit MI deviation'),
        ('mechanical_integrity.deviation.approve', 'Approve MI deviation'),
        ('mechanical_integrity.deviation.extend', 'Extend MI deviation'),
        ('mechanical_integrity.deviation.close', 'Close MI deviation'),
        ('mechanical_integrity.deviation.export', 'Export MI deviations')
      ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_record.permission_key, 'MECHANICAL_INTEGRITY', permission_record.permission_label
      where not exists (
        select 1 from public."Permission" where "tenantId" = tenant_row.id and "key" = permission_record.permission_key
      );
    end loop;
  end loop;
end $$;
