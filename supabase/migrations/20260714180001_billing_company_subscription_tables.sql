create table if not exists public.company_billing_customers (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  provider text not null default 'provider_agnostic',
  provider_customer_id text,
  billing_email text,
  billing_name text,
  billing_address_json jsonb not null default '{}'::jsonb,
  tax_id text,
  status text not null default 'active',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_billing_customers_status_check check (status in ('active','inactive','archived')),
  constraint company_billing_customers_company_provider_unique unique (company_id, provider)
);

create table if not exists public.company_subscriptions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  plan_id text references public.subscription_plans(id),
  provider text not null default 'provider_agnostic',
  provider_subscription_id text,
  status text not null default 'trialing',
  access_mode text not null default 'full',
  billing_interval text not null default 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  grace_period_start timestamptz,
  grace_period_end timestamptz,
  payment_failed_at timestamptz,
  latest_invoice_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_subscriptions_status_check check (status in ('trialing','active','past_due','unpaid','grace_period','paused','cancel_scheduled','cancelled','expired','incomplete','incomplete_expired','manual_review','enterprise_contract')),
  constraint company_subscriptions_access_mode_check check (access_mode in ('full','warning','grace','read_only','locked')),
  constraint company_subscriptions_interval_check check (billing_interval in ('monthly','yearly','custom'))
);

create unique index if not exists company_subscriptions_one_current_per_company
  on public.company_subscriptions(company_id)
  where status not in ('cancelled','expired','incomplete_expired');
