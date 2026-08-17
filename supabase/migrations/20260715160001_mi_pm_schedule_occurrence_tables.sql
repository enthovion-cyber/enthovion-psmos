-- Mechanical Integrity Phase 7 - preventive maintenance schedule and occurrences.

create table if not exists public.mi_pm_plan_schedules (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_pm_plans(id) on delete cascade,
  equipment_id text not null,
  scheduling_mode text not null default 'Fixed calendar interval',
  frequency_value integer,
  frequency_unit text,
  last_pm_date date,
  manual_override_due_date date,
  manual_override_reason text,
  manual_override_approved_by text,
  manual_override_approved_at timestamptz,
  due_soon_threshold_value integer default 30,
  due_soon_threshold_unit text default 'Days',
  critical_overdue_threshold_value integer default 30,
  critical_overdue_threshold_unit text default 'Days',
  occurrence_generation_window_value integer not null default 1,
  occurrence_generation_window_unit text not null default 'Years',
  scheduler_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_pm_occurrences (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_pm_plans(id) on delete cascade,
  equipment_id text not null,
  occurrence_number text not null,
  due_date date not null,
  due_basis text,
  status text not null default 'Scheduled',
  assigned_user_id text,
  assigned_team_id text,
  scheduled_start_date date,
  scheduled_end_date date,
  superseded_by_occurrence_id text references public.mi_pm_occurrences(id),
  completed_record_id text,
  completed_at timestamptz,
  completed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
