do $$
declare
  tenant_record record;
  permission_record record;
begin
  for tenant_record in select id from public."Tenant" loop
    for permission_record in
      select * from (values
        ('mechanical_integrity.sif.view', 'View SIS/SIF records'),
        ('mechanical_integrity.sif.create', 'Create SIS/SIF records'),
        ('mechanical_integrity.sif.edit', 'Edit SIS/SIF records'),
        ('mechanical_integrity.sif.archive', 'Archive SIS/SIF records'),
        ('mechanical_integrity.sif.import', 'Import SIS/SIF records'),
        ('mechanical_integrity.sif.export', 'Export SIS/SIF records'),
        ('mechanical_integrity.sif_device.view', 'View SIF devices'),
        ('mechanical_integrity.sif_device.manage', 'Manage SIF devices'),
        ('mechanical_integrity.sif_sil_data.view', 'View SIF SIL data'),
        ('mechanical_integrity.sif_sil_data.edit', 'Edit SIF SIL data'),
        ('mechanical_integrity.sif_lopa_link.manage', 'Manage SIF LOPA/SIL links'),
        ('mechanical_integrity.interlock.view', 'View interlocks'),
        ('mechanical_integrity.interlock.create', 'Create interlocks'),
        ('mechanical_integrity.interlock.edit', 'Edit interlocks'),
        ('mechanical_integrity.interlock.archive', 'Archive interlocks'),
        ('mechanical_integrity.interlock.import', 'Import interlocks'),
        ('mechanical_integrity.interlock.export', 'Export interlocks'),
        ('mechanical_integrity.critical_alarm.view', 'View critical alarms'),
        ('mechanical_integrity.critical_alarm.create', 'Create critical alarms'),
        ('mechanical_integrity.critical_alarm.edit', 'Edit critical alarms'),
        ('mechanical_integrity.critical_alarm.archive', 'Archive critical alarms'),
        ('mechanical_integrity.critical_alarm.import', 'Import critical alarms'),
        ('mechanical_integrity.critical_alarm.export', 'Export critical alarms'),
        ('mechanical_integrity.safeguard_test.view', 'View safeguard tests'),
        ('mechanical_integrity.safeguard_test.create', 'Create safeguard tests'),
        ('mechanical_integrity.safeguard_test.edit', 'Edit safeguard tests'),
        ('mechanical_integrity.safeguard_test.submit', 'Submit safeguard tests'),
        ('mechanical_integrity.safeguard_test.review', 'Review safeguard tests'),
        ('mechanical_integrity.safeguard_test.approve', 'Approve safeguard tests'),
        ('mechanical_integrity.safeguard_test.reject', 'Reject safeguard tests'),
        ('mechanical_integrity.safeguard_test.export', 'Export safeguard tests'),
        ('mechanical_integrity.safeguard_scheduler.view', 'View safeguard scheduler'),
        ('mechanical_integrity.safeguard_scheduler.run', 'Run safeguard scheduler'),
        ('mechanical_integrity.safeguard_scheduler.override', 'Override safeguard scheduler'),
        ('mechanical_integrity.safeguard_demand.view', 'View safeguard demand history'),
        ('mechanical_integrity.safeguard_demand.create', 'Create safeguard demand history'),
        ('mechanical_integrity.safeguard_demand.edit', 'Edit safeguard demand history'),
        ('mechanical_integrity.safeguard_bypass.view', 'View safeguard bypass foundation'),
        ('mechanical_integrity.safeguard_bypass.configure', 'Configure safeguard bypass foundation')
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
