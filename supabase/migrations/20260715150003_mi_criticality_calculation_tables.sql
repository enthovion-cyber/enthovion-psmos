-- Mechanical Integrity Phase 6 - calculation snapshots and results.

create table if not exists public.mi_criticality_calculation_results (
  id text primary key default gen_random_uuid()::text,
  assessment_id text not null references public.mi_criticality_assessments(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  config_id text,
  score_method text not null,
  consequence_score numeric,
  likelihood_score numeric,
  weighted_score numeric,
  final_risk_score numeric,
  risk_matrix_cell text,
  criticality_category text,
  inspection_priority text,
  rbi_candidate boolean not null default false,
  next_review_due date,
  risk_change_direction text,
  calculation_inputs_json jsonb not null default '{}'::jsonb,
  calculation_outputs_json jsonb not null default '{}'::jsonb,
  explanation text,
  calculation_status text not null default 'Calculated',
  calculation_error text,
  calculated_by text,
  calculated_at timestamptz not null default now()
);
