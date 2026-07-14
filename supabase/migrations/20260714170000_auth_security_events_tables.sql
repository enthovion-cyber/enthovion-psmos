create table if not exists public.auth_security_events (
  id text primary key default gen_random_uuid()::text,
  tenant_id text references public."Tenant"("id") on delete set null,
  user_id text references public."User"("id") on delete set null,
  company_id text references public."Company"("id") on delete set null,
  site_id text references public."Site"("id") on delete set null,
  event_type text not null,
  email text,
  provider text,
  success boolean not null default false,
  failure_reason text,
  ip_address text,
  user_agent text,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);
