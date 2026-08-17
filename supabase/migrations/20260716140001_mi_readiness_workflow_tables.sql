create table if not exists public.mi_readiness_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  assessment_id uuid not null references public.mi_readiness_assessments(id) on delete cascade,
  approval_stage text not null,
  approver_role text null,
  approver_user_id text null,
  action text not null,
  comments text null,
  e_signature_id text null,
  acted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.mi_readiness_linked_records (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  assessment_id uuid not null references public.mi_readiness_assessments(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_number text null,
  relationship_type text not null default 'Evidence',
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_readiness_history_events (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  assessment_id uuid null references public.mi_readiness_assessments(id) on delete cascade,
  equipment_id text not null references public."Equipment"("id") on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text null,
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_readiness_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text null,
  uploaded_by text null,
  file_name text not null,
  file_key text null,
  status text not null default 'Uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_report_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
