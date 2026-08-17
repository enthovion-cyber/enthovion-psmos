-- Mechanical Integrity Phase 5 - inspection record permissions.

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
        ('mechanical_integrity.inspection_record.view', 'View MI inspection records'),
        ('mechanical_integrity.inspection_record.create', 'Create MI inspection records'),
        ('mechanical_integrity.inspection_record.edit', 'Edit MI inspection records'),
        ('mechanical_integrity.inspection_record.submit', 'Submit MI inspection records'),
        ('mechanical_integrity.inspection_record.review', 'Review MI inspection records'),
        ('mechanical_integrity.inspection_record.approve', 'Approve MI inspection records'),
        ('mechanical_integrity.inspection_record.reject', 'Reject MI inspection records'),
        ('mechanical_integrity.inspection_record.archive', 'Archive MI inspection records'),
        ('mechanical_integrity.inspection_record.export', 'Export MI inspection records'),
        ('mechanical_integrity.inspection_checklist.execute', 'Execute MI inspection checklist'),
        ('mechanical_integrity.inspection_checklist.review', 'Review MI inspection checklist'),
        ('mechanical_integrity.ut_reading.view', 'View MI UT readings'),
        ('mechanical_integrity.ut_reading.create', 'Create MI UT readings'),
        ('mechanical_integrity.ut_reading.edit', 'Edit MI UT readings'),
        ('mechanical_integrity.ut_reading.import', 'Import MI UT readings'),
        ('mechanical_integrity.ut_reading.review', 'Review MI UT readings'),
        ('mechanical_integrity.ut_reading.approve', 'Approve MI UT readings'),
        ('mechanical_integrity.ut_reading.reject', 'Reject MI UT readings'),
        ('mechanical_integrity.ut_reading.supersede', 'Supersede MI UT readings'),
        ('mechanical_integrity.remaining_life.view', 'View MI remaining life'),
        ('mechanical_integrity.remaining_life.recalculate', 'Recalculate MI remaining life'),
        ('mechanical_integrity.inspection_finding.view', 'View MI inspection findings'),
        ('mechanical_integrity.inspection_finding.create', 'Create MI inspection findings'),
        ('mechanical_integrity.inspection_finding.edit', 'Edit MI inspection findings'),
        ('mechanical_integrity.inspection_finding.close', 'Close MI inspection findings'),
        ('mechanical_integrity.inspection_finding.link_action', 'Link MI finding action')
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
