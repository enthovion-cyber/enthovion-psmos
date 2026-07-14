alter table if exists public."UserProfile"
  add column if not exists "forcePasswordChange" boolean default false,
  add column if not exists "status" text default 'ACTIVE',
  add column if not exists "lastLoginAt" timestamptz,
  add column if not exists "lastPasswordChangeAt" timestamptz;

alter table if exists public."CompanyDomain"
  add column if not exists "allowGoogleLogin" boolean default false,
  add column if not exists "allowAutoJoin" boolean default false,
  add column if not exists "status" text default 'ACTIVE';
