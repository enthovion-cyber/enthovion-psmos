-- Mechanical Integrity Phase 3 - CML/TML reading campaigns.

create table if not exists public.mi_cml_reading_campaigns (
  id text primary key default gen_random_uuid()::text,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  campaign_number text null,
  title text not null,
  inspection_method text null,
  inspection_date date null,
  inspector_user_id text null,
  contractor_company text null,
  work_order_reference text null,
  status text not null default 'Draft',
  notes text null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
