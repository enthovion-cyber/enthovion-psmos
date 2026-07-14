create table if not exists public."UserActiveContext" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "activeCompanyId" text null references public."Company"("id") on delete set null,
  "activeSiteId" text null references public."Site"("id") on delete set null,
  "updatedAt" timestamptz not null default now(),
  constraint "UserActiveContext_user_unique" unique ("tenantId", "userId")
);

create table if not exists public."UserContextSwitchEvent" (
  "id" text primary key default gen_random_uuid()::text,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "userId" text not null references public."User"("id") on delete cascade,
  "eventType" text not null check ("eventType" in ('COMPANY_SWITCH', 'SITE_SWITCH', 'CONTEXT_REFRESH', 'ACCESS_DENIED')),
  "companyId" text null references public."Company"("id") on delete set null,
  "siteId" text null references public."Site"("id") on delete set null,
  "previousCompanyId" text null,
  "previousSiteId" text null,
  "reason" text null,
  "ipAddress" text null,
  "userAgent" text null,
  "metadata" jsonb null,
  "createdAt" timestamptz not null default now()
);

alter table public."UserActiveContext" enable row level security;
alter table public."UserContextSwitchEvent" enable row level security;

drop policy if exists "user active context self select" on public."UserActiveContext";
create policy "user active context self select"
on public."UserActiveContext"
for select
to authenticated
using ("userId" = public.auth_user_id() or public.is_super_admin());

drop policy if exists "user active context self upsert" on public."UserActiveContext";
create policy "user active context self upsert"
on public."UserActiveContext"
for all
to authenticated
using ("userId" = public.auth_user_id() or public.is_super_admin())
with check ("userId" = public.auth_user_id() or public.is_super_admin());

drop policy if exists "user context switch events self select" on public."UserContextSwitchEvent";
create policy "user context switch events self select"
on public."UserContextSwitchEvent"
for select
to authenticated
using ("userId" = public.auth_user_id() or public.is_super_admin() or public.user_has_permission('audit.view'));

drop policy if exists "user context switch events insert self" on public."UserContextSwitchEvent";
create policy "user context switch events insert self"
on public."UserContextSwitchEvent"
for insert
to authenticated
with check ("userId" = public.auth_user_id() or public.is_super_admin());
