-- Mechanical Integrity Phase 4 - scheduler run history.

create table if not exists public.mi_inspection_scheduler_runs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text null,
  run_type text not null default 'Manual',
  status text not null default 'Running',
  triggered_by text not null default 'User',
  triggered_by_user_id text null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  total_plans_evaluated integer not null default 0,
  updated_plans_count integer not null default 0,
  generated_occurrences_count integer not null default 0,
  scheduler_errors_count integer not null default 0,
  error_summary_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mi_inspection_due_date_evaluations_run_fk'
  ) then
    alter table public.mi_inspection_due_date_evaluations
      add constraint mi_inspection_due_date_evaluations_run_fk
      foreign key (scheduler_run_id) references public.mi_inspection_scheduler_runs(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'mi_inspection_schedule_occurrences_run_fk'
  ) then
    alter table public.mi_inspection_schedule_occurrences
      add constraint mi_inspection_schedule_occurrences_run_fk
      foreign key (generated_by_scheduler_run_id) references public.mi_inspection_scheduler_runs(id);
  end if;
end $$;
