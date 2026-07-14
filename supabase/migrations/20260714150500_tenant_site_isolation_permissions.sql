do $$
declare
  tenant_id text;
  permission_key text;
  permission_label text;
begin
  for tenant_id in select "id" from public."Tenant" loop
    for permission_key, permission_label in
      values
        ('tenant.context.view', 'View tenant context'),
        ('tenant.switch_company', 'Switch company workspace'),
        ('tenant.switch_site', 'Switch active site'),
        ('company.view', 'View companies'),
        ('company.manage', 'Manage companies'),
        ('site.view', 'View sites'),
        ('site.manage', 'Manage sites'),
        ('navigation.view', 'View generated navigation'),
        ('settings.view', 'View settings'),
        ('settings.manage', 'Manage settings'),
        ('audit.view', 'View audit logs'),
        ('users.view', 'View users'),
        ('users.manage', 'Manage users'),
        ('roles.view', 'View roles'),
        ('roles.manage', 'Manage roles')
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'FOUNDATION', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
