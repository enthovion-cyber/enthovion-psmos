create table if not exists public.billing_events (
  id text primary key default gen_random_uuid()::text,
  company_id text references public."Company"(id) on delete set null,
  provider text not null default 'provider_agnostic',
  provider_event_id text,
  event_type text not null,
  status text not null default 'processed',
  payload_json jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  error_message text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_events_status_check check (status in ('processed','ignored','failed','replayed')),
  constraint billing_events_provider_event_unique unique (provider, provider_event_id)
);
