create table if not exists public.company_entitlements (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  plan_id text references public.subscription_plans(id),
  source text not null default 'plan',
  entitlement_key text not null,
  entitlement_type text not null,
  enabled boolean not null default false,
  limit_value numeric,
  limit_unit text,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  config_json jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_entitlements_source_check check (source in ('plan','custom','override','manual','enterprise')),
  constraint company_entitlements_type_check check (entitlement_type in ('module','limit','feature','storage','export','report','security','support')),
  constraint company_entitlements_unique unique (company_id, entitlement_key)
);

create table if not exists public.billing_admin_overrides (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  override_type text not null,
  reason text not null,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  config_json jsonb not null default '{}'::jsonb,
  approved_by text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_admin_overrides_type_check check (override_type in ('entitlement','limit','access_mode','grace_period','plan'))
);
