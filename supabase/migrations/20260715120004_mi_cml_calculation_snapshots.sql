-- Mechanical Integrity Phase 3 - CML/TML calculation snapshots.

create table if not exists public.mi_cml_calculation_snapshots (
  id text primary key default gen_random_uuid()::text,
  cml_id text not null references public.mi_cmls(id) on delete cascade,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  calculation_status text not null,
  latest_reading_id text null references public.mi_cml_thickness_readings(id) on delete set null,
  latest_thickness numeric(12,4) null,
  latest_thickness_unit text null,
  latest_reading_date date null,
  short_term_corrosion_rate numeric(12,5) null,
  long_term_corrosion_rate numeric(12,5) null,
  governing_corrosion_rate numeric(12,5) null,
  corrosion_rate_unit text not null default 'mm/year',
  remaining_life_years numeric(12,3) null,
  next_due_date date null,
  next_due_basis text null,
  risk_status text null,
  alert_status text null,
  methodology_json jsonb not null default '{}'::jsonb,
  input_snapshot_json jsonb not null default '{}'::jsonb,
  calculated_by text null,
  calculated_at timestamptz not null default now()
);
