create table if not exists public.billing_audit_events (
  id text primary key default gen_random_uuid()::text,
  company_id text references public."Company"(id) on delete set null,
  actor_user_id text references public."User"(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  before_value_json jsonb,
  after_value_json jsonb,
  provider_event_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
