do $$
declare
  tenant_row record;
  permission_key text;
  permission_label text;
begin
  for tenant_row in select "id" from public."Tenant"
  loop
    for permission_key, permission_label in
      select * from (values
        ('mechanical_integrity.readiness.view', 'View MI readiness'),
        ('mechanical_integrity.readiness.create', 'Create MI readiness assessment'),
        ('mechanical_integrity.readiness.edit', 'Edit MI readiness assessment'),
        ('mechanical_integrity.readiness.run_check', 'Run MI readiness check'),
        ('mechanical_integrity.readiness.submit', 'Submit MI readiness assessment'),
        ('mechanical_integrity.readiness.review', 'Review MI readiness assessment'),
        ('mechanical_integrity.readiness.approve', 'Approve MI readiness assessment'),
        ('mechanical_integrity.readiness.reject', 'Reject MI readiness assessment'),
        ('mechanical_integrity.readiness.override', 'Override MI readiness decision'),
        ('mechanical_integrity.readiness.waive_blocker', 'Waive MI readiness blocker'),
        ('mechanical_integrity.readiness.clear_blocker', 'Clear MI readiness blocker'),
        ('mechanical_integrity.readiness.close', 'Close MI readiness assessment'),
        ('mechanical_integrity.readiness.import', 'Import MI readiness assessments'),
        ('mechanical_integrity.readiness.export', 'Export MI readiness assessments')
      ) as permissions(key, label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row."id", permission_key, 'MECHANICAL_INTEGRITY', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row."id" and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
