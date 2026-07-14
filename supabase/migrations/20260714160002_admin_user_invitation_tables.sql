-- Admin User Management - invitations, hashed tokens, and email delivery tracking.

alter table if exists public."Invitation"
  add column if not exists "companyId" text,
  add column if not exists "siteId" text,
  add column if not exists "roleId" text,
  add column if not exists "acceptedAt" timestamptz,
  add column if not exists "updatedAt" timestamptz default now();

create table if not exists public."UserEmailDeliveryLog" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text references public."User"("id") on delete set null,
  "invitationId" text,
  "email" text not null,
  "templateKey" text not null,
  "subject" text,
  "status" text not null default 'Queued',
  "providerMessageId" text,
  "errorMessage" text,
  "sentAt" timestamptz,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."PasswordResetToken" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "tokenHash" text not null unique,
  "status" text not null default 'PENDING',
  "expiresAt" timestamptz not null,
  "usedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);
