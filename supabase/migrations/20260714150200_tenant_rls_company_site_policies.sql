alter table public."Company" enable row level security;
alter table public."Site" enable row level security;
alter table public."UserCompanyMembership" enable row level security;
alter table public."UserSite" enable row level security;
alter table public."UserRole" enable row level security;

drop policy if exists "company tenant access" on public."Company";
create policy "company tenant access"
on public."Company"
for select
to authenticated
using (public.user_has_company_access("id"));

drop policy if exists "site tenant access" on public."Site";
create policy "site tenant access"
on public."Site"
for select
to authenticated
using (public.user_has_company_access("companyId") and public.user_has_site_access("id"));

drop policy if exists "company memberships self access" on public."UserCompanyMembership";
create policy "company memberships self access"
on public."UserCompanyMembership"
for select
to authenticated
using ("userId" = public.auth_user_id() or public.is_super_admin() or public.user_has_company_access("companyId"));

drop policy if exists "user sites self access" on public."UserSite";
create policy "user sites self access"
on public."UserSite"
for select
to authenticated
using ("userId" = public.auth_user_id() or public.is_super_admin() or public.user_has_site_access("siteId"));

drop policy if exists "user roles self access" on public."UserRole";
create policy "user roles self access"
on public."UserRole"
for select
to authenticated
using ("userId" = public.auth_user_id() or public.is_super_admin());
