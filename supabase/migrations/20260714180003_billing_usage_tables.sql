create table if not exists public.company_usage_counters (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  usage_key text not null,
  usage_value numeric not null default 0,
  usage_unit text not null default 'count',
  period_start timestamptz,
  period_end timestamptz,
  last_calculated_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_usage_counters_unique unique (company_id, site_id, usage_key, period_start, period_end)
);

create table if not exists public.company_usage_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  site_id text references public."Site"(id) on delete set null,
  user_id text references public."User"(id) on delete set null,
  usage_key text not null,
  delta_value numeric not null default 0,
  usage_unit text not null default 'count',
  source_module text,
  source_record_id text,
  event_type text not null default 'usage_recorded',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
