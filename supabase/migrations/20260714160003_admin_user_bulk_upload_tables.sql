-- Admin User Management - bulk upload jobs and row validation.

create table if not exists public."UserBulkImportJob" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "uploadedBy" text references public."User"("id") on delete set null,
  "fileName" text not null,
  "status" text not null default 'Validating',
  "totalRows" integer not null default 0,
  "validRows" integer not null default 0,
  "errorRows" integer not null default 0,
  "createdUsersCount" integer not null default 0,
  "skippedUsersCount" integer not null default 0,
  "inviteSentCount" integer not null default 0,
  "passwordGeneratedCount" integer not null default 0,
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
  "passwordGenerated" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("jobId", "rowNumber")
);
