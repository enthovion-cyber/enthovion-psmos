create table if not exists public.auth_session_states (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."User"("id") on delete cascade,
  company_id text references public."Company"("id") on delete set null,
  active_session_id text,
  session_version integer not null default 1,
  permission_version integer not null default 1,
  force_logout boolean not null default false,
  force_logout_reason text,
  stale_reason text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
