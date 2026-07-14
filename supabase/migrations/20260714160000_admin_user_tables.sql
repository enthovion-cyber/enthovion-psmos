-- Admin User Management - core user/profile access extensions.

alter table if exists public."UserProfile"
  add column if not exists "personalEmail" text,
  add column if not exists "employeeId" text,
  add column if not exists "employerType" text default 'Employee',
  add column if not exists "contractorCompanyId" text,
  add column if not exists "forcePasswordChange" boolean default false,
  add column if not exists "mfaRequired" boolean default false,
  add column if not exists "lastPasswordChangeAt" timestamptz,
  add column if not exists "lastMfaVerifiedAt" timestamptz,
  add column if not exists "updatedAt" timestamptz default now();

create table if not exists public."UserCompanyMembership" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "companyId" text not null references public."Company"("id") on delete cascade,
  "accessLevel" text not null default 'Member',
  "status" text not null default 'ACTIVE',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("tenantId", "userId", "companyId")
);

create table if not exists public."UserUnitAccess" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "unitId" text not null references public."Unit"("id") on delete cascade,
  "accessLevel" text not null default 'Member',
  "status" text not null default 'ACTIVE',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("tenantId", "userId", "unitId")
);

create table if not exists public."UserAreaAccess" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "areaId" text not null references public."Area"("id") on delete cascade,
  "accessLevel" text not null default 'Member',
  "status" text not null default 'ACTIVE',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("tenantId", "userId", "areaId")
);
