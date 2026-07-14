create table if not exists public.subscription_plans (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  code text not null unique,
  description text,
  plan_type text not null default 'custom',
  status text not null default 'active',
  public_visible boolean not null default true,
  sort_order integer not null default 100,
  trial_days integer,
  default_currency text not null default 'USD',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint subscription_plans_type_check check (plan_type in ('trial','starter','pro','enterprise','custom')),
  constraint subscription_plans_status_check check (status in ('active','inactive','archived'))
);

create table if not exists public.subscription_plan_prices (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.subscription_plans(id) on delete cascade,
  provider_price_id text,
  currency text not null default 'USD',
  billing_interval text not null default 'monthly',
  amount_cents integer not null default 0,
  seat_pricing_type text not null default 'fixed',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plan_prices_interval_check check (billing_interval in ('monthly','yearly','custom')),
  constraint subscription_plan_prices_seat_type_check check (seat_pricing_type in ('fixed','per_seat','tiered','custom')),
  constraint subscription_plan_prices_status_check check (status in ('active','inactive','archived')),
  constraint subscription_plan_prices_unique unique (plan_id, currency, billing_interval)
);

create table if not exists public.subscription_plan_entitlements (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.subscription_plans(id) on delete cascade,
  entitlement_key text not null,
  entitlement_type text not null,
  enabled boolean not null default false,
  limit_value numeric,
  limit_unit text,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plan_entitlements_type_check check (entitlement_type in ('module','limit','feature','storage','export','report','security','support')),
  constraint subscription_plan_entitlements_unique unique (plan_id, entitlement_key)
);
