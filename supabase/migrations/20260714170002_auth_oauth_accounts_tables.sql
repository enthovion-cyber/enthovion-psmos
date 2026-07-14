create table if not exists public.auth_oauth_accounts (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."User"("id") on delete cascade,
  provider text not null,
  provider_user_id text,
  provider_email text not null,
  provider_domain text,
  linked_at timestamptz not null default now(),
  last_login_at timestamptz,
  status text not null default 'ACTIVE',
  metadata_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);
