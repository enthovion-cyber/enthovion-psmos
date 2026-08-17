-- Mechanical Integrity Phase 7 - PM/calibration permissions.

do $$
declare
  tenant_record record;
  permission_key text;
  permission_label text;
begin
  for tenant_record in select id from public."Tenant" loop
    for permission_key, permission_label in
      select * from (values
      ('mechanical_integrity.pm_plan.view', 'View MI PM plans'),
      ('mechanical_integrity.pm_plan.create', 'Create MI PM plans'),
      ('mechanical_integrity.pm_plan.edit', 'Edit MI PM plans'),
      ('mechanical_integrity.pm_plan.submit', 'Submit MI PM plans'),
      ('mechanical_integrity.pm_plan.approve', 'Approve MI PM plans'),
      ('mechanical_integrity.pm_plan.reject', 'Reject MI PM plans'),
      ('mechanical_integrity.pm_plan.archive', 'Archive MI PM plans'),
      ('mechanical_integrity.pm_plan.import', 'Import MI PM plans'),
      ('mechanical_integrity.pm_plan.export', 'Export MI PM plans'),
      ('mechanical_integrity.pm_record.view', 'View MI PM records'),
      ('mechanical_integrity.pm_record.create', 'Create MI PM records'),
      ('mechanical_integrity.pm_record.edit', 'Edit MI PM records'),
      ('mechanical_integrity.pm_record.submit', 'Submit MI PM records'),
      ('mechanical_integrity.pm_record.review', 'Review MI PM records'),
      ('mechanical_integrity.pm_record.approve', 'Approve MI PM records'),
      ('mechanical_integrity.pm_record.reject', 'Reject MI PM records'),
      ('mechanical_integrity.pm_record.export', 'Export MI PM records'),
      ('mechanical_integrity.calibration_plan.view', 'View MI calibration plans'),
      ('mechanical_integrity.calibration_plan.create', 'Create MI calibration plans'),
      ('mechanical_integrity.calibration_plan.edit', 'Edit MI calibration plans'),
      ('mechanical_integrity.calibration_plan.submit', 'Submit MI calibration plans'),
      ('mechanical_integrity.calibration_plan.approve', 'Approve MI calibration plans'),
      ('mechanical_integrity.calibration_plan.reject', 'Reject MI calibration plans'),
      ('mechanical_integrity.calibration_plan.archive', 'Archive MI calibration plans'),
      ('mechanical_integrity.calibration_plan.import', 'Import MI calibration plans'),
      ('mechanical_integrity.calibration_plan.export', 'Export MI calibration plans'),
      ('mechanical_integrity.calibration_record.view', 'View MI calibration records'),
      ('mechanical_integrity.calibration_record.create', 'Create MI calibration records'),
      ('mechanical_integrity.calibration_record.edit', 'Edit MI calibration records'),
      ('mechanical_integrity.calibration_record.submit', 'Submit MI calibration records'),
      ('mechanical_integrity.calibration_record.review', 'Review MI calibration records'),
      ('mechanical_integrity.calibration_record.approve', 'Approve MI calibration records'),
      ('mechanical_integrity.calibration_record.reject', 'Reject MI calibration records'),
      ('mechanical_integrity.calibration_record.export', 'Export MI calibration records'),
      ('mechanical_integrity.pm_scheduler.view', 'View MI PM scheduler'),
      ('mechanical_integrity.pm_scheduler.run', 'Run MI PM scheduler'),
      ('mechanical_integrity.calibration_scheduler.view', 'View MI calibration scheduler'),
      ('mechanical_integrity.calibration_scheduler.run', 'Run MI calibration scheduler'),
      ('mechanical_integrity.pm_calibration.override', 'Override MI PM/calibration schedule')
    ) as permissions(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_key, 'MECHANICAL_INTEGRITY', permission_label
      where not exists (select 1 from public."Permission" where "tenantId" = tenant_record.id and "key" = permission_key);
    end loop;
  end loop;
end $$;
