-- Mechanical Integrity Phase 5 - inspection checklist execution snapshot.

create table if not exists public.mi_inspection_record_checklist_items (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  site_id text not null references public."Site"(id) on delete cascade,
  inspection_record_id text not null references public.mi_inspection_records(id) on delete cascade,
  plan_checklist_item_id text null references public.mi_inspection_plan_checklist_items(id) on delete set null,
  item_number text not null,
  section_title text null,
  item_title text not null,
  requirement_text text null,
  response_type text not null default 'Pass/Fail',
  response_value_json jsonb not null default '{}'::jsonb,
  pass_fail text null,
  comment text null,
  evidence_required boolean not null default false,
  evidence_document_id text null,
  finding_created boolean not null default false,
  completed_by text null,
  completed_at timestamptz null,
  required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
