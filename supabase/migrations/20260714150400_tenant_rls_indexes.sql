create index if not exists "UserActiveContext_tenant_user_idx" on public."UserActiveContext" ("tenantId", "userId");
create index if not exists "UserActiveContext_company_site_idx" on public."UserActiveContext" ("activeCompanyId", "activeSiteId");
create index if not exists "UserContextSwitchEvent_user_created_idx" on public."UserContextSwitchEvent" ("tenantId", "userId", "createdAt" desc);
create index if not exists "UserContextSwitchEvent_company_site_idx" on public."UserContextSwitchEvent" ("companyId", "siteId");
create index if not exists "UserCompanyMembership_user_company_idx" on public."UserCompanyMembership" ("tenantId", "userId", "companyId");
create index if not exists "UserSite_user_site_idx" on public."UserSite" ("userId", "siteId");
create index if not exists "UserSite_company_site_idx" on public."UserSite" ("companyId", "siteId");

do $$
declare
  t text;
begin
  foreach t in array array['Equipment','Document','ActionItem','Notification','PTWPermit','MocChange','Pssr','HazopStudy','LOPAStudy','Incident'] loop
    if to_regclass(format('public.%I', t)) is not null then
      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = t and column_name = 'tenantId'
      ) then
        execute format('create index if not exists %I on public.%I ("tenantId")', t || '_tenant_idx', t);
      end if;
      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = t and column_name = 'companyId'
      ) then
        execute format('create index if not exists %I on public.%I ("companyId")', t || '_company_idx', t);
      end if;
      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = t and column_name = 'siteId'
      ) then
        execute format('create index if not exists %I on public.%I ("siteId")', t || '_site_idx', t);
      end if;
    end if;
  end loop;
end $$;
