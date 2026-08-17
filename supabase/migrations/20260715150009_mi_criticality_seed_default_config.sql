-- Mechanical Integrity Phase 6 - default configuration and permissions.

do $$
declare
  tenant_row record;
  permission_key text;
  permission_label text;
begin
  for tenant_row in select id from public."Tenant"
  loop
    for permission_key, permission_label in
      select * from (values
        ('mechanical_integrity.criticality.view', 'View MI criticality'),
        ('mechanical_integrity.criticality.create', 'Create MI criticality assessments'),
        ('mechanical_integrity.criticality.edit', 'Edit MI criticality assessments'),
        ('mechanical_integrity.criticality.submit', 'Submit MI criticality assessments'),
        ('mechanical_integrity.criticality.review', 'Review MI criticality assessments'),
        ('mechanical_integrity.criticality.approve', 'Approve MI criticality assessments'),
        ('mechanical_integrity.criticality.reject', 'Reject MI criticality assessments'),
        ('mechanical_integrity.criticality.archive', 'Archive MI criticality assessments'),
        ('mechanical_integrity.criticality.export', 'Export MI criticality'),
        ('mechanical_integrity.criticality.override', 'Override MI criticality result'),
        ('mechanical_integrity.criticality_config.view', 'View MI criticality config'),
        ('mechanical_integrity.criticality_config.manage', 'Manage MI criticality config'),
        ('mechanical_integrity.criticality_calculation.view', 'View MI criticality calculation'),
        ('mechanical_integrity.criticality_calculation.recalculate', 'Recalculate MI criticality')
      ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'MECHANICAL_INTEGRITY', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
