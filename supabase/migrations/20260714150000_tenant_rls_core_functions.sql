-- Tenant/Site isolation core helpers.
-- These helpers are intentionally claim-based so browser/API clients cannot trust request body company/site ids.

create or replace function public.auth_user_id()
returns text
language sql
stable
as $$
  select coalesce((select auth.uid())::text, current_setting('request.jwt.claim.sub', true), '');
$$;

create or replace function public.current_company_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.active_company_id', true), ''),
    nullif(current_setting('request.jwt.claim.company_id', true), '')
  );
$$;

create or replace function public.current_site_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.active_site_id', true), ''),
    nullif(current_setting('request.jwt.claim.site_id', true), '')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public."UserRole" ur
    join public."Role" r on r."id" = ur."roleId"
    where ur."userId" = public.auth_user_id()
      and r."key" in ('platform_admin', 'super_admin')
  );
$$;

create or replace function public.user_has_company_access(company_id text)
returns boolean
language sql
stable
as $$
  select public.is_super_admin()
    or company_id is null
    or exists (
      select 1
      from public."UserCompanyMembership" ucm
      where ucm."userId" = public.auth_user_id()
        and ucm."companyId" = company_id
        and coalesce(upper(ucm."status"), 'ACTIVE') = 'ACTIVE'
    )
    or exists (
      select 1
      from public."UserSite" us
      where us."userId" = public.auth_user_id()
        and us."companyId" = company_id
    );
$$;

create or replace function public.user_has_site_access(site_id text)
returns boolean
language sql
stable
as $$
  select public.is_super_admin()
    or site_id is null
    or exists (
      select 1
      from public."UserSite" us
      where us."userId" = public.auth_user_id()
        and us."siteId" = site_id
    );
$$;

create or replace function public.user_has_permission(permission_key text)
returns boolean
language sql
stable
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public."UserRole" ur
      join public."RolePermission" rp on rp."roleId" = ur."roleId"
      join public."Permission" p on p."id" = rp."permissionId"
      where ur."userId" = public.auth_user_id()
        and p."key" = permission_key
    );
$$;
