-- Mechanical Integrity Phase 4 - inspection plan import jobs.

create table if not exists public.mi_inspection_plan_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
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

create table if not exists public.mi_inspection_plan_import_rows (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.mi_inspection_plan_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data_json jsonb not null default '{}'::jsonb,
  normalized_data_json jsonb null,
  validation_status text not null default 'Pending',
  validation_errors_json jsonb not null default '[]'::jsonb,
  created_plan_id text null,
  updated_plan_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
