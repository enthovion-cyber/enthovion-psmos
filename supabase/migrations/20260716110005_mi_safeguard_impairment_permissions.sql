do $$
declare
  tenant_row record;
  permission_record record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_record in
      select * from (values
        ('mechanical_integrity.impairment.view', 'View safeguard bypass / impairment log'),
        ('mechanical_integrity.impairment.create', 'Create safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.edit', 'Edit safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.submit', 'Submit safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.approve', 'Approve safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.reject', 'Reject safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.activate', 'Activate safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.extend', 'Extend safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.restore', 'Restore safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.verify_restoration', 'Verify safeguard restoration'),
        ('mechanical_integrity.impairment.close', 'Close safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.cancel', 'Cancel safeguard bypass / impairment'),
        ('mechanical_integrity.impairment.import', 'Import safeguard bypass / impairments'),
        ('mechanical_integrity.impairment.export', 'Export safeguard bypass / impairments'),
        ('mechanical_integrity.impairment.admin_override', 'Override safeguard impairment controls')
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
