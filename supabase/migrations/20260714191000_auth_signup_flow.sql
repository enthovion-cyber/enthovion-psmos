create table if not exists public.signup_onboarding_sessions (
  id text primary key default gen_random_uuid()::text,
  email text not null,
  provider text not null default 'email',
  provider_user_id text,
  status text not null default 'verification_pending',
  current_step text not null default 'verify_email',
  user_id text,
  tenant_id text references public."Tenant"(id) on delete set null on update cascade,
  company_id text references public."Company"(id) on delete set null on update cascade,
  site_id text references public."Site"(id) on delete set null on update cascade,
  email_verified_at timestamptz,
  completed_at timestamptz,
  last_resend_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signup_onboarding_sessions_email_provider_unique unique (email, provider),
  constraint signup_onboarding_sessions_status_check check (status in ('verification_pending','email_verified','profile_pending','workspace_pending','workspace_complete','plan_pending','trialing','completed','abandoned','blocked')),
  constraint signup_onboarding_sessions_step_check check (current_step in ('verify_email','complete_profile','complete_workspace','choose_plan','success','blocked'))
);

create index if not exists idx_signup_onboarding_sessions_email on public.signup_onboarding_sessions(lower(email));
create index if not exists idx_signup_onboarding_sessions_company_id on public.signup_onboarding_sessions(company_id);
create index if not exists idx_signup_onboarding_sessions_user_id on public.signup_onboarding_sessions(user_id);

create table if not exists public.signup_security_events (
  id text primary key default gen_random_uuid()::text,
  session_id text references public.signup_onboarding_sessions(id) on delete set null,
  email text,
  event_type text not null,
  provider text,
  success boolean not null default true,
  failure_reason text,
  ip_address text,
  user_agent text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_signup_security_events_session_id on public.signup_security_events(session_id);
create index if not exists idx_signup_security_events_email on public.signup_security_events(lower(email));

alter table if exists public.signup_onboarding_sessions enable row level security;
alter table if exists public.signup_security_events enable row level security;

drop policy if exists service_role_all_signup_onboarding_sessions on public.signup_onboarding_sessions;
create policy service_role_all_signup_onboarding_sessions on public.signup_onboarding_sessions
  for all to service_role using (true) with check (true);

drop policy if exists service_role_all_signup_security_events on public.signup_security_events;
create policy service_role_all_signup_security_events on public.signup_security_events
  for all to service_role using (true) with check (true);
