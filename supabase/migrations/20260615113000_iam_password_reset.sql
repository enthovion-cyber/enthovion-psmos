create table if not exists public."PasswordResetToken" (
  id text primary key,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "userId" text not null references public."User"(id) on delete cascade,
  "tokenHash" text not null unique,
  status text not null default 'PENDING',
  "expiresAt" timestamp without time zone not null,
  "usedAt" timestamp without time zone,
  "createdAt" timestamp without time zone not null default current_timestamp
);

create index if not exists "PasswordResetToken_userId_idx"
  on public."PasswordResetToken" ("userId");

create index if not exists "PasswordResetToken_tenantId_idx"
  on public."PasswordResetToken" ("tenantId");
