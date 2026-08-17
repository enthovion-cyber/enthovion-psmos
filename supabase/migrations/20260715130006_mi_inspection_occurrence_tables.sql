-- Mechanical Integrity Phase 4 - future inspection occurrences.

create table if not exists public.mi_inspection_schedule_occurrences (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  occurrence_number text not null,
  due_date date not null,
  due_basis text null,
  status text not null default 'Scheduled',
  assigned_user_id text null,
  assigned_team_id text null,
  scheduled_start_date date null,
  scheduled_end_date date null,
  generated_by_scheduler_run_id text null,
  source_due_date_evaluation_id text null references public.mi_inspection_due_date_evaluations(id),
  source_rule_id text null,
  superseded_by_occurrence_id text null,
  completed_at timestamptz null,
  completed_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mi_inspection_occurrence_plan_due_unique unique (plan_id, due_date)
);
