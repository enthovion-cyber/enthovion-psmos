create table if not exists public.auth_rate_limit_events (
  id text primary key default gen_random_uuid()::text,
  email_or_user_hash text not null,
  ip_address text,
  event_type text not null,
  attempts integer not null default 1,
  blocked_until timestamptz,
  metadata_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
