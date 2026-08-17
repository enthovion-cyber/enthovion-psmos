-- Mechanical Integrity Phase 4 - approval and revision foundation.

create table if not exists public.mi_inspection_plan_revisions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  revision_number integer not null,
  status text not null default 'Draft',
  change_reason text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  submitted_by text null,
  submitted_at timestamptz null,
  reviewed_by text null,
  reviewed_at timestamptz null,
  approved_by text null,
  approved_at timestamptz null,
  rejected_by text null,
  rejected_at timestamptz null,
  rejection_reason text null,
  created_at timestamptz not null default now()
);
