-- Mechanical Integrity Phase 1 - seed equipment types and permissions safely for all tenants.

insert into public.mi_equipment_types (company_id, type_key, type_name, category, default_inspection_required, default_pm_required, default_calibration_required, safety_critical_default)
values
  (null, 'pressure_vessel', 'Pressure vessel', 'Static equipment', true, true, false, true),
  (null, 'storage_tank', 'Storage tank', 'Static equipment', true, true, false, true),
  (null, 'piping_circuit', 'Piping circuit', 'Piping', true, true, false, true),
  (null, 'pump', 'Pump', 'Rotating equipment', true, true, false, false),
  (null, 'compressor', 'Compressor', 'Rotating equipment', true, true, false, false),
  (null, 'heat_exchanger', 'Heat exchanger', 'Static equipment', true, true, false, false),
  (null, 'boiler', 'Boiler', 'Static equipment', true, true, false, true),
  (null, 'reactor', 'Reactor', 'Static equipment', true, true, false, true),
  (null, 'psv_relief_device', 'PSV / relief device', 'Safeguard', true, true, true, true),
  (null, 'sis_sif_component', 'SIS / SIF component', 'Safeguard', true, true, true, true),
  (null, 'interlock', 'Interlock', 'Safeguard', true, true, true, true),
  (null, 'critical_alarm', 'Critical alarm', 'Safeguard', true, true, true, true),
  (null, 'esd_system', 'ESD system', 'Safeguard', true, true, true, true),
  (null, 'fire_protection_system', 'Fire protection system', 'Safeguard', true, true, true, true),
  (null, 'gas_detector', 'Gas detector', 'Safeguard', true, true, true, true),
  (null, 'electrical_equipment', 'Electrical equipment', 'Electrical', true, true, true, false),
  (null, 'instrument', 'Instrument', 'Instrument', true, true, true, false),
  (null, 'rotating_equipment', 'Rotating equipment', 'Rotating equipment', true, true, false, false),
  (null, 'static_equipment', 'Static equipment', 'Static equipment', true, true, false, false),
  (null, 'other', 'Other', 'Other', false, false, false, false)
on conflict (company_id, type_key) do nothing;

do $$
declare
  tenant_row record;
  permission_row record;
  role_row record;
  permission_id text;
begin
  for tenant_row in select "id" from public."Tenant" loop
    for permission_row in
      select * from (values
        ('mechanical_integrity.dashboard.view','View MI dashboard'),
        ('mechanical_integrity.equipment.view','View MI equipment'),
        ('mechanical_integrity.equipment.create','Create MI equipment'),
        ('mechanical_integrity.equipment.edit','Edit MI equipment'),
        ('mechanical_integrity.equipment.archive','Archive MI equipment'),
        ('mechanical_integrity.equipment.import','Import MI equipment'),
        ('mechanical_integrity.equipment.export','Export MI equipment'),
        ('mechanical_integrity.equipment.history.view','View MI equipment history'),
        ('mechanical_integrity.technical_data.view','View MI technical data'),
        ('mechanical_integrity.technical_data.edit','Edit MI technical data'),
        ('mechanical_integrity.criticality.view','View MI criticality'),
        ('mechanical_integrity.criticality.edit','Edit MI criticality'),
        ('mechanical_integrity.readiness.view','View MI readiness'),
        ('mechanical_integrity.readiness.edit','Edit MI readiness'),
        ('mechanical_integrity.linked_records.view','View MI linked records'),
        ('mechanical_integrity.linked_records.manage','Manage MI linked records'),
        ('mechanical_integrity.documents.view','View MI documents'),
        ('mechanical_integrity.documents.manage','Manage MI documents'),
        ('mechanical_integrity.report.view','View MI reports'),
        ('mechanical_integrity.report.generate','Generate MI reports'),
        ('mechanical_integrity.export','Export MI data')
      ) as p(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row."id", permission_row.permission_key, 'mechanical_integrity', permission_row.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row."id" and "key" = permission_row.permission_key
      );
    end loop;

    for role_row in
      select * from public."Role"
      where "tenantId" = tenant_row."id"
        and "key" in ('super_admin','company_admin','site_admin','maintenance_manager','hse_manager','operations_manager','engineer')
    loop
      for permission_id in
        select "id" from public."Permission"
        where "tenantId" = tenant_row."id" and "moduleKey" = 'mechanical_integrity'
      loop
        insert into public."RolePermission" ("id", "roleId", "permissionId")
        select gen_random_uuid()::text, role_row."id", permission_id
        where not exists (
          select 1 from public."RolePermission"
          where "roleId" = role_row."id" and "permissionId" = permission_id
        );
      end loop;
    end loop;
  end loop;
end $$;
