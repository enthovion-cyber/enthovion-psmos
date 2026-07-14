alter table public."Role" add column if not exists "description" text;
alter table public."Role" add column if not exists "systemRole" boolean not null default false;
alter table public."Role" add column if not exists "active" boolean not null default true;

alter table public."Permission" add column if not exists "action" text;
alter table public."Permission" add column if not exists "description" text;

alter table public."RolePermission" add column if not exists "effect" text not null default 'allow';

alter type public."UserStatus" add value if not exists 'ARCHIVED';

alter table public."UserProfile" add column if not exists "personalEmail" text;
alter table public."UserProfile" add column if not exists "employeeId" text;
alter table public."UserProfile" add column if not exists "employerType" text;
alter table public."UserProfile" add column if not exists "contractorCompanyId" text;
alter table public."UserProfile" add column if not exists "forcePasswordChange" boolean not null default false;
alter table public."UserProfile" add column if not exists "mfaRequired" boolean not null default false;
alter table public."UserProfile" add column if not exists "signatureUrl" text;
alter table public."UserProfile" add column if not exists "signatureStatus" text;

alter table public."User" add column if not exists "lastLoginAt" timestamptz;

create table if not exists public."UserCompanyMembership" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User"("id") on delete cascade,
  "companyId" text not null references public."Company"("id") on delete cascade,
  "status" text not null default 'ACTIVE',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists "UserCompanyMembership_user_company_unique"
on public."UserCompanyMembership" ("userId", "companyId");

create table if not exists public."UserUnitAccess" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User"("id") on delete cascade,
  "companyId" text,
  "siteId" text references public."Site"("id") on delete cascade,
  "unitId" text references public."Unit"("id") on delete cascade,
  "accessLevel" text not null default 'READ',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists "UserUnitAccess_user_unit_unique"
on public."UserUnitAccess" ("userId", "unitId");

create table if not exists public."UserAreaAccess" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User"("id") on delete cascade,
  "companyId" text,
  "siteId" text references public."Site"("id") on delete cascade,
  "areaId" text references public."Area"("id") on delete cascade,
  "accessLevel" text not null default 'READ',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists "UserAreaAccess_user_area_unique"
on public."UserAreaAccess" ("userId", "areaId");

create table if not exists public."UserPermissionOverride" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "permissionId" text not null references public."Permission"("id") on delete cascade,
  "companyId" text,
  "siteId" text,
  "effect" text not null default 'allow',
  "reason" text,
  "createdBy" text references public."User"("id") on delete set null,
  "createdAt" timestamptz not null default now()
);

create unique index if not exists "UserPermissionOverride_scope_unique"
on public."UserPermissionOverride" ("userId", "permissionId", coalesce("companyId", ''), coalesce("siteId", ''));

create table if not exists public."UserBulkImportJob" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "companyId" text,
  "siteId" text,
  "uploadedBy" text references public."User"("id") on delete set null,
  "fileName" text not null,
  "fileKey" text,
  "status" text not null default 'Uploaded',
  "totalRows" integer not null default 0,
  "validRows" integer not null default 0,
  "errorRows" integer not null default 0,
  "createdUsersCount" integer not null default 0,
  "skippedUsersCount" integer not null default 0,
  "inviteSentCount" integer not null default 0,
  "passwordGeneratedCount" integer not null default 0,
  "errorReportKey" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."UserBulkImportRow" (
  "id" text primary key default gen_random_uuid()::text,
  "jobId" text not null references public."UserBulkImportJob"("id") on delete cascade,
  "rowNumber" integer not null,
  "rawData" jsonb not null default '{}'::jsonb,
  "normalizedData" jsonb not null default '{}'::jsonb,
  "validationStatus" text not null default 'Pending',
  "validationErrors" jsonb not null default '[]'::jsonb,
  "createdUserId" text references public."User"("id") on delete set null,
  "inviteStatus" text,
  "passwordGenerated" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists "UserBulkImportRow_job_row_unique"
on public."UserBulkImportRow" ("jobId", "rowNumber");

create table if not exists public."UserEmailDeliveryLog" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text references public."User"("id") on delete set null,
  "emailType" text not null,
  "recipientEmail" text not null,
  "status" text not null,
  "providerMessageId" text,
  "errorMessage" text,
  "sentAt" timestamptz,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."UserSecurityEvent" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text references public."User"("id") on delete cascade,
  "eventType" text not null,
  "ipAddress" text,
  "userAgent" text,
  "metadata" jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."PermissionPreset" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text references public."Tenant"("id") on delete cascade,
  "companyId" text,
  "moduleKey" text not null,
  "name" text not null,
  "description" text,
  "permissionsJson" jsonb not null default '{}'::jsonb,
  "systemPreset" boolean not null default true,
  "active" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists "PermissionPreset_tenant_module_name_unique"
on public."PermissionPreset" (coalesce("tenantId", ''), "moduleKey", lower("name"), coalesce("companyId", ''));

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
select gen_random_uuid()::text, t."id", p.key, p.module_key, p.label, p.action, p.description
from public."Tenant" t
cross join (
  values
    ('users.view', 'users', 'View Users', 'view', 'View admin user list and profiles'),
    ('users.create', 'users', 'Create Users', 'create', 'Create users manually'),
    ('users.edit', 'users', 'Edit Users', 'edit', 'Edit user profile, status, scope, and settings'),
    ('users.deactivate', 'users', 'Deactivate Users', 'deactivate', 'Deactivate or reactivate users'),
    ('users.delete', 'users', 'Delete Users', 'delete', 'Delete non-system users where policy allows'),
    ('users.reset_password', 'users', 'Reset Passwords', 'reset_password', 'Send password reset or temporary credential flow'),
    ('users.bulk_upload', 'users', 'Bulk Upload Users', 'bulk_upload', 'Import users from CSV or Excel'),
    ('users.invite', 'users', 'Invite Users', 'invite', 'Send invitation emails'),
    ('users.export', 'users', 'Export Users', 'export', 'Export user directory'),
    ('roles.view', 'roles', 'View Roles', 'view', 'View roles and permission matrix'),
    ('roles.create', 'roles', 'Create Roles', 'create', 'Create role templates'),
    ('roles.edit', 'roles', 'Edit Roles', 'edit', 'Edit roles and permission matrix'),
    ('roles.assign', 'roles', 'Assign Roles', 'assign', 'Assign roles to users'),
    ('permissions.view', 'permissions', 'View Permissions', 'view', 'View effective permissions'),
    ('permissions.edit', 'permissions', 'Edit Permissions', 'edit', 'Assign explicit permission overrides'),
    ('settings.view', 'settings', 'View Settings', 'view', 'View settings'),
    ('company.manage', 'company', 'Manage Company', 'manage', 'Manage company-level access'),
    ('site.manage', 'site', 'Manage Sites', 'manage', 'Manage site-level access')
) as p(key, module_key, label, action, description)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t."id" and existing."key" = p.key
);

insert into public."RolePermission" ("roleId", "permissionId", "effect")
select r."id", p."id", 'allow'
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId"
where r."key" in ('platform_admin', 'corporate_admin', 'site_admin', 'super_admin')
  and p."key" in (
    'users.view', 'users.create', 'users.edit', 'users.deactivate', 'users.delete',
    'users.reset_password', 'users.bulk_upload', 'users.invite', 'users.export',
    'roles.view', 'roles.create', 'roles.edit', 'roles.assign',
    'permissions.view', 'permissions.edit', 'settings.view', 'company.manage', 'site.manage'
  )
on conflict do nothing;

update public."Role"
set "systemRole" = true
where "key" in ('platform_admin', 'corporate_admin', 'site_admin', 'super_admin');

insert into public."PermissionPreset" ("id", "tenantId", "moduleKey", "name", "description", "permissionsJson", "systemPreset", "active")
select gen_random_uuid()::text, t."id", p.module_key, p.name, p.description, p.permissions_json::jsonb, true, true
from public."Tenant" t
cross join (
  values
    ('moc', 'No Access', 'Hide MOC and deny all MOC API access', '{"permissions":[]}'::jsonb),
    ('moc', 'Read Only MOC', 'View MOC records only', '{"permissions":["moc.dashboard.view","moc.view"]}'::jsonb),
    ('moc', 'Allow All MOC', 'All MOC permissions inside assigned scope', '{"permissions":["moc.dashboard.view","moc.view","moc.create","moc.edit","moc.submit","moc.approve","moc.reject","moc.close","moc.cancel","moc.risk.edit","moc.impact.edit","moc.engineering.upload","moc.workflow.approve","moc.temporary.extend","moc.emergency.review","moc.pssr.trigger","moc.release_startup","moc.export"]}'::jsonb),
    ('ptw', 'No Access', 'Hide PTW and deny all PTW API access', '{"permissions":[]}'::jsonb),
    ('ptw', 'Read Only PTW', 'View PTW dashboard and permits only', '{"permissions":["ptw.dashboard.view","ptw.view"]}'::jsonb),
    ('ptw', 'Allow All PTW', 'All PTW permissions inside assigned scope', '{"permissions":["ptw.dashboard.view","ptw.view","ptw.create","ptw.edit","ptw.submit","ptw.approve","ptw.reject","ptw.issue","ptw.suspend","ptw.resume","ptw.extend","ptw.close","ptw.cancel","ptw.gas.add","ptw.gas.verify","ptw.isolation.apply","ptw.isolation.verify","ptw.conflicts.override","ptw.handover.complete","ptw.sign","ptw.export"]}'::jsonb),
    ('pssr', 'No Access', 'Hide PSSR and deny all PSSR API access', '{"permissions":[]}'::jsonb),
    ('pssr', 'Read Only PSSR', 'View PSSR records only', '{"permissions":["pssr.dashboard.view","pssr.view"]}'::jsonb),
    ('pssr', 'Allow All PSSR', 'All PSSR permissions inside assigned scope', '{"permissions":["pssr.dashboard.view","pssr.view","pssr.create","pssr.edit","pssr.trigger_from_moc","pssr.checklist.complete","pssr.field.verify","pssr.documents.verify","pssr.training.verify","pssr.testing.verify","pssr.punch.close","pssr.authorization.sign","pssr.authorization.release","pssr.certificate.generate","pssr.certificate.secure_share","pssr.export"]}'::jsonb)
) as p(module_key, name, description, permissions_json)
where not exists (
  select 1 from public."PermissionPreset" existing
  where existing."tenantId" = t."id"
    and existing."moduleKey" = p.module_key
    and lower(existing."name") = lower(p.name)
);
