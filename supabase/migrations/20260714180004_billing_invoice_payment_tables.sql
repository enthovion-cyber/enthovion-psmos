create table if not exists public.billing_invoices (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  provider text not null default 'provider_agnostic',
  provider_invoice_id text,
  invoice_number text,
  status text not null default 'draft',
  currency text not null default 'USD',
  amount_due_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  hosted_invoice_url text,
  invoice_pdf_url text,
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_invoices_status_check check (status in ('draft','open','paid','void','uncollectible','failed','refunded'))
);

create table if not exists public.billing_payment_methods (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  provider text not null default 'provider_agnostic',
  provider_payment_method_id text,
  type text not null default 'card',
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  is_default boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payment_methods_status_check check (status in ('active','inactive','expired','removed'))
);
