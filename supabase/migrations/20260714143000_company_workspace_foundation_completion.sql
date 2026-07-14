create extension if not exists pgcrypto;

alter table public."Company"
  add column if not exists "displayName" text,
  add column if not exists "slug" text,
  add column if not exists "currency" text,
  add column if not exists "phone" text,
  add column if not exists "website" text,
  add column if not exists "onboardingStatus" text not null default 'COMPLETED',
  add column if not exists "createdBy" text references public."User"(id) on delete set null,
  add column if not exists "updatedBy" text references public."User"(id) on delete set null,
  add column if not exists "deletedAt" timestamptz;

alter table public."Site"
  add column if not exists "deletedAt" timestamptz,
  add column if not exists "deletionReason" text;

alter table public."Department"
  add column if not exists "status" text not null default 'ACTIVE',
  add column if not exists "deletedAt" timestamptz,
  add column if not exists "deletionReason" text;

alter table public."Unit"
  add column if not exists "departmentId" text references public."Department"(id) on delete set null,
  add column if not exists "status" text not null default 'ACTIVE',
  add column if not exists "deletedAt" timestamptz,
  add column if not exists "deletionReason" text;

alter table public."Area"
  add column if not exists "siteId" text references public."Site"(id) on delete set null,
  add column if not exists "status" text not null default 'ACTIVE',
  add column if not exists "deletedAt" timestamptz,
  add column if not exists "deletionReason" text;

update public."Company"
set "slug" = coalesce("slug", lower(regexp_replace(coalesce("code", "name"), '[^a-zA-Z0-9]+', '-', 'g'))),
    "displayName" = coalesce("displayName", "name"),
    "currency" = coalesce("currency", 'USD')
where "slug" is null or "displayName" is null or "currency" is null;

update public."Area" a
set "siteId" = u."siteId"
from public."Unit" u
where a."unitId" = u.id and a."siteId" is null;

create table if not exists public."CompanySetting" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "companyId" text not null references public."Company"(id) on delete cascade,
  "defaultTimezone" text not null default 'UTC',
  "defaultCurrency" text not null default 'USD',
  "dateFormat" text not null default 'YYYY-MM-DD',
  "timeFormat" text not null default '24h',
  "language" text not null default 'en',
  "allowGoogleLogin" boolean not null default false,
  "allowDomainAutoJoin" boolean not null default false,
  "requireMfa" boolean not null default false,
  "requireESignature" boolean not null default false,
  "passwordPolicyJson" jsonb not null default '{}'::jsonb,
  "moduleSettingsJson" jsonb not null default '{}'::jsonb,
  "createdBy" text references public."User"(id) on delete set null,
  "updatedBy" text references public."User"(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."CompanyDomain" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "companyId" text not null references public."Company"(id) on delete cascade,
  "domain" text not null,
  "verificationStatus" text not null default 'PENDING',
  "verificationMethod" text not null default 'DNS_TXT',
  "verificationTokenHash" text,
  "verifiedAt" timestamptz,
  "verifiedBy" text references public."User"(id) on delete set null,
  "allowGoogleLogin" boolean not null default false,
  "allowAutoJoin" boolean not null default false,
  "domainOwnerEmail" text,
  "status" text not null default 'ACTIVE',
  "notes" text,
  "createdBy" text references public."User"(id) on delete set null,
  "updatedBy" text references public."User"(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

insert into public."CompanySetting" ("tenantId", "companyId", "defaultTimezone", "defaultCurrency")
select c."tenantId", c.id, coalesce(c."timezone", 'UTC'), coalesce(c."currency", 'USD')
from public."Company" c
where not exists (
  select 1 from public."CompanySetting" s
  where s."tenantId" = c."tenantId" and s."companyId" = c.id
);

create unique index if not exists "Company_tenant_slug_unique"
on public."Company" ("tenantId", lower(coalesce("slug", '')));
create unique index if not exists "Company_tenant_code_unique"
on public."Company" ("tenantId", lower(coalesce("code", '')));
create unique index if not exists "CompanySetting_company_unique"
on public."CompanySetting" ("tenantId", "companyId");
create unique index if not exists "CompanyDomain_domain_unique"
on public."CompanyDomain" (lower("domain"));
create index if not exists "CompanyDomain_company_idx" on public."CompanyDomain" ("tenantId", "companyId");
create index if not exists "Site_company_code_idx" on public."Site" ("tenantId", "companyId", "code");
create index if not exists "Department_company_site_idx" on public."Department" ("tenantId", "siteId");
create index if not exists "Unit_company_site_department_idx" on public."Unit" ("tenantId", "siteId", "departmentId");
create index if not exists "Area_company_site_unit_idx" on public."Area" ("tenantId", "siteId", "unitId");

alter table public."CompanySetting" enable row level security;
alter table public."CompanyDomain" enable row level security;

drop policy if exists "CompanySetting_service_role_all" on public."CompanySetting";
create policy "CompanySetting_service_role_all" on public."CompanySetting"
for all to service_role using (true) with check (true);

drop policy if exists "CompanyDomain_service_role_all" on public."CompanyDomain";
create policy "CompanyDomain_service_role_all" on public."CompanyDomain"
for all to service_role using (true) with check (true);

drop policy if exists "CompanySetting_authenticated_scope" on public."CompanySetting";
create policy "CompanySetting_authenticated_scope" on public."CompanySetting"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "companyId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)))
  )
);

drop policy if exists "CompanyDomain_authenticated_scope" on public."CompanyDomain";
create policy "CompanyDomain_authenticated_scope" on public."CompanyDomain"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "companyId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)))
  )
);

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
select gen_random_uuid()::text, t.id, p.key, p.module_key, p.label, p.action, p.description
from public."Tenant" t
cross join (
  values
    ('company.view', 'company', 'View Company', 'view', 'View company workspace profile and settings'),
    ('company.create', 'company', 'Create Company', 'create', 'Start company workspace onboarding'),
    ('company.edit', 'company', 'Edit Company', 'edit', 'Edit company profile and settings'),
    ('company.manage', 'company', 'Manage Company', 'manage', 'Manage company workspace'),
    ('company.domain.view', 'company', 'View Company Domains', 'view', 'View company domain records'),
    ('company.domain.manage', 'company', 'Manage Company Domains', 'manage', 'Create, edit, verify, and archive company domains'),
    ('company.audit.view', 'company', 'View Company Audit', 'view', 'View company setup audit history'),
    ('site.view', 'site', 'View Sites', 'view', 'View sites/plants'),
    ('site.create', 'site', 'Create Sites', 'create', 'Create sites/plants'),
    ('site.edit', 'site', 'Edit Sites', 'edit', 'Edit sites/plants'),
    ('site.delete', 'site', 'Archive Sites', 'delete', 'Archive or deactivate sites/plants'),
    ('site.manage', 'site', 'Manage Sites', 'manage', 'Manage sites/plants'),
    ('department.view', 'department', 'View Departments', 'view', 'View departments'),
    ('department.create', 'department', 'Create Departments', 'create', 'Create departments'),
    ('department.edit', 'department', 'Edit Departments', 'edit', 'Edit departments'),
    ('department.delete', 'department', 'Archive Departments', 'delete', 'Archive departments'),
    ('department.manage', 'department', 'Manage Departments', 'manage', 'Manage departments'),
    ('unit.view', 'unit', 'View Process Units', 'view', 'View process units'),
    ('unit.create', 'unit', 'Create Process Units', 'create', 'Create process units'),
    ('unit.edit', 'unit', 'Edit Process Units', 'edit', 'Edit process units'),
    ('unit.delete', 'unit', 'Archive Process Units', 'delete', 'Archive process units'),
    ('unit.manage', 'unit', 'Manage Process Units', 'manage', 'Manage process units'),
    ('area.view', 'area', 'View Areas', 'view', 'View areas'),
    ('area.create', 'area', 'Create Areas', 'create', 'Create areas'),
    ('area.edit', 'area', 'Edit Areas', 'edit', 'Edit areas'),
    ('area.delete', 'area', 'Archive Areas', 'delete', 'Archive areas'),
    ('area.manage', 'area', 'Manage Areas', 'manage', 'Manage areas'),
    ('tenant.switch_company', 'tenant', 'Switch Company', 'switch_company', 'Switch active company context'),
    ('tenant.switch_site', 'tenant', 'Switch Site', 'switch_site', 'Switch active site context'),
    ('tenant.context.view', 'tenant', 'View Tenant Context', 'view', 'View current workspace and site context')
) as p(key, module_key, label, action, description)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);

insert into public."RolePermission" ("roleId", "permissionId", "effect")
select r.id, p.id, 'allow'
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId"
where r."key" in ('platform_admin', 'corporate_admin', 'company_admin', 'site_admin', 'super_admin')
  and p."key" in (
    'company.view','company.create','company.edit','company.manage','company.domain.view','company.domain.manage','company.audit.view',
    'site.view','site.create','site.edit','site.delete','site.manage',
    'department.view','department.create','department.edit','department.delete','department.manage',
    'unit.view','unit.create','unit.edit','unit.delete','unit.manage',
    'area.view','area.create','area.edit','area.delete','area.manage',
    'tenant.switch_company','tenant.switch_site','tenant.context.view'
  )
  and not exists (
    select 1 from public."RolePermission" existing
    where existing."roleId" = r.id and existing."permissionId" = p.id
  );
