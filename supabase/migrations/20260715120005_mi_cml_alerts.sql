-- Mechanical Integrity Phase 3 - CML/TML alert state.

create table if not exists public.mi_cml_alerts (
  id text primary key default gen_random_uuid()::text,
  cml_id text not null references public.mi_cmls(id) on delete cascade,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  alert_type text not null,
  severity text not null,
  title text not null,
  description text null,
  status text not null default 'Open',
  source_snapshot_id text null references public.mi_cml_calculation_snapshots(id) on delete set null,
  acknowledged_by text null,
  acknowledged_at timestamptz null,
  resolved_by text null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
