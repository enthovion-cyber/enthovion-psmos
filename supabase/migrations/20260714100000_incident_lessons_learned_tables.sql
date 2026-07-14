alter table public.incidents
  add column if not exists lessons_learned_status text,
  add column if not exists lessons_required boolean,
  add column if not exists lessons_required_reason text,
  add column if not exists lessons_total_count integer default 0,
  add column if not exists lessons_approved_count integer default 0,
  add column if not exists lessons_pending_review_count integer default 0,
  add column if not exists lessons_distributed_count integer default 0,
  add column if not exists lessons_acknowledgement_status text,
  add column if not exists lessons_verification_status text,
  add column if not exists lessons_ready_for_final_report boolean default false;

create table if not exists public.incident_lessons (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  incident_id text not null references public.incidents(id) on delete cascade,
  lesson_number text not null,
  title text not null,
  lesson_statement text not null,
  lesson_type text not null,
  source_type text not null,
  applicability_scope text not null,
  target_audience_json jsonb not null default '[]'::jsonb,
  training_required boolean not null default false,
  procedure_update_required boolean not null default false,
  communication_required boolean not null default false,
  owner_id text,
  due_date timestamptz,
  review_status text not null default 'Draft',
  distribution_status text not null default 'Not Distributed',
  acknowledgement_status text not null default 'Not Required',
  verification_status text not null default 'Not Required',
  notes text,
  archived_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_lesson_source_links (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  incident_id text not null references public.incidents(id) on delete cascade,
  lesson_id text references public.incident_lessons(id) on delete cascade,
  source_type text not null,
  source_id text,
  source_title_snapshot text,
  coverage_status text not null default 'Unmapped',
  justification_if_no_lesson text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_lesson_distributions (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  incident_id text not null references public.incidents(id) on delete cascade,
  lesson_id text references public.incident_lessons(id) on delete cascade,
  audience_json jsonb not null default '[]'::jsonb,
  channel text,
  message_snapshot text,
  distribution_status text not null default 'Draft',
  distributed_by text,
  distributed_at timestamptz,
  notification_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_lesson_acknowledgements (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  incident_id text not null references public.incidents(id) on delete cascade,
  lesson_id text references public.incident_lessons(id) on delete cascade,
  recipient_user_id text,
  acknowledgement_status text not null default 'Pending',
  acknowledged_at timestamptz,
  overdue boolean not null default false,
  reminder_sent_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_lesson_reviews (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  incident_id text not null references public.incidents(id) on delete cascade,
  status text not null default 'Not Requested',
  reviewer_id text,
  due_date timestamptz,
  comments text,
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  rework_required boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.incident_lessons to authenticated;
grant select, insert, update, delete on public.incident_lesson_source_links to authenticated;
grant select, insert, update, delete on public.incident_lesson_distributions to authenticated;
grant select, insert, update, delete on public.incident_lesson_acknowledgements to authenticated;
grant select, insert, update, delete on public.incident_lesson_reviews to authenticated;
