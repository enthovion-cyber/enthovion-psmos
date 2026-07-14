-- Admin User Management - user security event timeline.

create table if not exists public."UserSecurityEvent" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "eventType" text not null,
  "description" text,
  "ipAddress" text,
  "userAgent" text,
  "metadata" jsonb,
  "createdAt" timestamptz not null default now()
);
