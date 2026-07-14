-- Admin User Management - permission and role template seed.

do $$
declare
  tenant_row record;
  permission_row record;
  role_row record;
begin
  for tenant_row in select "id" from public."Tenant" loop
    for permission_row in
      select * from (values
        ('users.view','View users'),
        ('users.create','Create users'),
        ('users.edit','Edit users'),
        ('users.deactivate','Deactivate users'),
        ('users.delete','Delete users'),
        ('users.reset_password','Reset user passwords'),
        ('users.bulk_upload','Bulk upload users'),
        ('users.invite','Invite users'),
        ('users.export','Export users'),
        ('roles.manage','Manage roles'),
        ('permissions.view','View permissions'),
        ('permissions.edit','Edit permissions'),
        ('audit.view','View audit logs'),
        ('navigation.view','View navigation'),
        ('settings.view','View settings'),
        ('settings.manage','Manage settings')
      ) as p(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row."id", permission_row.permission_key, 'admin', permission_row.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row."id" and "key" = permission_row.permission_key
      );
    end loop;

    for role_row in
      select * from (values
        ('super_admin','Super Admin'),
        ('company_admin','Company Admin'),
        ('site_admin','Site Admin'),
        ('plant_manager','Plant Manager'),
        ('hse_manager','HSE Manager'),
        ('operations_manager','Operations Manager'),
        ('maintenance_manager','Maintenance Manager'),
        ('engineer','Engineer'),
        ('ptw_issuing_authority','PTW Issuing Authority'),
        ('performing_authority','Performing Authority'),
        ('gas_tester','Gas Tester'),
        ('isolating_authority','Isolating Authority'),
        ('contractor','Contractor'),
        ('viewer','Viewer'),
        ('auditor','Auditor')
      ) as r(role_key, role_name)
    loop
      insert into public."Role" ("id", "tenantId", "key", "name", "scopeType", "systemRole", "updatedAt")
      select gen_random_uuid()::text, tenant_row."id", role_row.role_key, role_row.role_name,
        case when role_row.role_key = 'site_admin' then 'SITE' when role_row.role_key = 'company_admin' then 'COMPANY' else 'TENANT' end,
        role_row.role_key in ('super_admin'),
        now()
      where not exists (
        select 1 from public."Role"
        where "tenantId" = tenant_row."id" and "key" = role_row.role_key
      );
    end loop;
  end loop;
end $$;
