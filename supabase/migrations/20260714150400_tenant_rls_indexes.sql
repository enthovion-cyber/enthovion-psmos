do $$
declare
  index_spec record;
  index_columns_sql text;
  operational_table text;
  scope_column text;
begin
  -- These tables exist in both legacy camelCase and newer snake_case variants
  -- depending on which foundation migrations have already been applied.
  -- Create each index only when the exact table and columns exist.
  for index_spec in
    select *
    from (
      values
        ('UserActiveContext', 'UserActiveContext_tenant_user_idx', array['tenantId', 'userId']),
        ('UserActiveContext', 'UserActiveContext_tenant_user_idx', array['tenant_id', 'user_id']),
        ('UserActiveContext', 'UserActiveContext_company_site_idx', array['activeCompanyId', 'activeSiteId']),
        ('UserActiveContext', 'UserActiveContext_company_site_idx', array['active_company_id', 'active_site_id']),
        ('UserContextSwitchEvent', 'UserContextSwitchEvent_user_created_idx', array['tenantId', 'userId', 'createdAt']),
        ('UserContextSwitchEvent', 'UserContextSwitchEvent_user_created_idx', array['tenant_id', 'user_id', 'created_at']),
        ('UserContextSwitchEvent', 'UserContextSwitchEvent_company_site_idx', array['companyId', 'siteId']),
        ('UserContextSwitchEvent', 'UserContextSwitchEvent_company_site_idx', array['company_id', 'site_id']),
        ('UserCompanyMembership', 'UserCompanyMembership_tenant_user_company_idx', array['tenantId', 'userId', 'companyId']),
        ('UserCompanyMembership', 'UserCompanyMembership_tenant_user_company_idx', array['tenant_id', 'user_id', 'company_id']),
        ('UserCompanyMembership', 'UserCompanyMembership_user_company_idx', array['userId', 'companyId']),
        ('UserCompanyMembership', 'UserCompanyMembership_user_company_idx', array['user_id', 'company_id']),
        ('UserSite', 'UserSite_user_site_idx', array['userId', 'siteId']),
        ('UserSite', 'UserSite_user_site_idx', array['user_id', 'site_id']),
        ('UserSite', 'UserSite_company_site_idx', array['companyId', 'siteId']),
        ('UserSite', 'UserSite_company_site_idx', array['company_id', 'site_id'])
    ) as specs(table_name, index_name, column_names)
  loop
    if to_regclass(format('public.%I', index_spec.table_name)) is not null
      and not exists (
        select 1
        from unnest(index_spec.column_names) as required_column(column_name)
        where not exists (
          select 1
          from information_schema.columns c
          where c.table_schema = 'public'
            and c.table_name = index_spec.table_name
            and c.column_name = required_column.column_name
        )
      )
    then
      select string_agg(format('%I', index_column.column_name), ', ')
      into index_columns_sql
      from unnest(index_spec.column_names) as index_column(column_name);

      execute format(
        'create index if not exists %I on public.%I (%s)',
        index_spec.index_name,
        index_spec.table_name,
        index_columns_sql
      );
    end if;
  end loop;

  foreach operational_table in array array[
    'Equipment',
    'Document',
    'ActionItem',
    'Notification',
    'PTWPermit',
    'MocChange',
    'Pssr',
    'HazopStudy',
    'LOPAStudy',
    'Incident'
  ] loop
    if to_regclass(format('public.%I', operational_table)) is not null then
      foreach scope_column in array array['tenantId', 'tenant_id', 'companyId', 'company_id', 'siteId', 'site_id'] loop
        if exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = operational_table
            and column_name = scope_column
        ) then
          execute format(
            'create index if not exists %I on public.%I (%I)',
            operational_table || '_' || replace(lower(scope_column), '_', '') || '_idx',
            operational_table,
            scope_column
          );
        end if;
      end loop;
    end if;
  end loop;
end $$;
