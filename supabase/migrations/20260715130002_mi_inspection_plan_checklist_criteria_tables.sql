-- Mechanical Integrity Phase 4 - checklist and acceptance criteria foundation.

create table if not exists public.mi_inspection_plan_checklist_items (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  item_number text null,
  section_title text null,
  item_title text not null,
  requirement_text text null,
  response_type text not null default 'Pass/Fail',
  acceptance_criteria text null,
  evidence_required boolean not null default false,
  attachment_required boolean not null default false,
  required boolean not null default true,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_inspection_plan_acceptance_criteria (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  criterion_type text not null,
  criterion_key text not null,
  operator text null,
  value_numeric numeric null,
  value_text text null,
  unit text null,
  severity_if_failed text null,
  create_deficiency_on_fail boolean not null default false,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
