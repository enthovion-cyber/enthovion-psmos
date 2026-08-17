-- Mechanical Integrity Phase 7 - preventive maintenance finding/action foundation.

create table if not exists public.mi_pm_record_findings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  pm_record_id text not null references public.mi_pm_records(id) on delete cascade,
  finding_number text not null,
  finding_type text not null default 'PM Finding',
  severity text not null default 'Medium',
  title text not null,
  description text,
  repair_required boolean not null default false,
  engineering_review_required boolean not null default false,
  action_required boolean not null default false,
  recommended_action text,
  due_date date,
  owner_user_id text,
  status text not null default 'Open',
  linked_action_id text,
  linked_deficiency_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
