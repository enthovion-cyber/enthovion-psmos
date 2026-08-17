-- Mechanical Integrity Phase 4 - inspection plan scheduling configuration.

create table if not exists public.mi_inspection_plan_schedules (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  scheduling_mode text not null default 'Fixed calendar interval',
  frequency_value integer null,
  frequency_unit text null,
  last_inspection_date date null,
  last_completed_occurrence_id text null,
  manual_override_due_date date null,
  manual_override_reason text null,
  manual_override_approved_by text null,
  manual_override_approved_at timestamptz null,
  rule_id text null references public.mi_inspection_schedule_rules(id),
  rule_snapshot_json jsonb null,
  remaining_life_source text null,
  cml_scope_source text null,
  governing_cml_id text null,
  occurrence_generation_window_value integer not null default 1,
  occurrence_generation_window_unit text not null default 'Years',
  scheduler_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mi_inspection_plan_schedules_unique unique (plan_id)
);
