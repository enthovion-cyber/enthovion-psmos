-- Mechanical Integrity Phase 7 - calibration tolerance evaluation snapshots.

create table if not exists public.mi_calibration_evaluations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  calibration_record_id text not null references public.mi_calibration_records(id) on delete cascade,
  plan_id text,
  official boolean not null default false,
  as_found_result text,
  as_left_result text,
  final_result text,
  failed_point_count integer not null default 0,
  out_of_tolerance_as_found boolean not null default false,
  out_of_tolerance_as_left boolean not null default false,
  certificate_status text,
  readiness_impact text,
  calculation_inputs_json jsonb not null default '{}'::jsonb,
  calculation_outputs_json jsonb not null default '{}'::jsonb,
  evaluated_by text,
  evaluated_at timestamptz not null default now()
);
