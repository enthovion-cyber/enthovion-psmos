do $$
declare
  target_table text;
  tables text[] := array[
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
  ];
begin
  foreach target_table in array tables loop
    if to_regclass(format('public.%I', target_table)) is not null
      and exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = target_table and c.column_name = 'tenantId')
      and exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = target_table and c.column_name = 'companyId')
      and exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = target_table and c.column_name = 'siteId') then
      execute format('alter table public.%I enable row level security', target_table);
      execute format('drop policy if exists %I on public.%I', target_table || ' tenant site access', target_table);
      execute format(
        'create policy %I on public.%I for all to authenticated using (
          coalesce("tenantId", '''') = coalesce(current_setting(''request.jwt.claim.tenant_id'', true), coalesce("tenantId", ''''))
          and public.user_has_company_access("companyId")
          and public.user_has_site_access("siteId")
        ) with check (
          coalesce("tenantId", '''') = coalesce(current_setting(''request.jwt.claim.tenant_id'', true), coalesce("tenantId", ''''))
          and public.user_has_company_access("companyId")
          and public.user_has_site_access("siteId")
        )',
        target_table || ' tenant site access',
        target_table
      );
    end if;
  end loop;
end $$;
