-- Admin User Management - role and effective permission support.

alter table if exists public."Role"
  add column if not exists "description" text,
  add column if not exists "scopeType" text default 'TENANT',
  add column if not exists "systemRole" boolean default false,
  add column if not exists "disabledAt" timestamptz,
  add column if not exists "updatedAt" timestamptz default now();

alter table if exists public."UserRole"
  add column if not exists "id" text default gen_random_uuid()::text,
  add column if not exists "scopeType" text default 'TENANT',
  add column if not exists "companyId" text,
  add column if not exists "siteId" text,
  add column if not exists "createdAt" timestamptz default now();

create table if not exists public."UserPermissionOverride" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "permissionId" text not null references public."Permission"("id") on delete cascade,
  "companyId" text,
  "siteId" text,
  "effect" text not null check ("effect" in ('allow', 'deny')),
  "reason" text,
  "createdBy" text references public."User"("id") on delete set null,
  "createdAt" timestamptz not null default now(),
  unique ("tenantId", "userId", "permissionId", "companyId", "siteId")
);

create table if not exists public."PermissionPreset" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "moduleKey" text not null,
  "name" text not null,
  "description" text,
  "permissionsJson" jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("tenantId", "moduleKey", "name")
);
